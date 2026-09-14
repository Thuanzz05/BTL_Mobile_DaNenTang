import { PoolConnection } from 'mysql2/promise';
import { transaction } from '../config/database';
import { PhienHocTap } from '../types/models';
import { AppError } from '../utils/app-error';
import { quizState, shuffled } from '../utils/quiz.util';
import { UuidUtil } from '../utils/uuid.util';
import { LearningService, lockUser, sessionForUser } from './learning.service';

interface Snapshot {
  tu_tieng_anh: string;
  phien_am: string | null;
  url_am_thanh: string | null;
  url_hinh_anh: string | null;
  nghia_tieng_viet: string;
  lua_chon: string[];
}

interface Member {
  tu_vung_id: string;
  noi_dung_trac_nghiem: Snapshot;
}

interface Question {
  id: string;
  tu_vung_id: string;
  thu_tu: number;
  lua_chon: { id: string; noi_dung: string }[];
  dap_an_dung_id: string;
  dap_an_chon_id: string | null;
  dung: number | null;
  ma_yeu_cau: string | null;
  thoi_gian_tra_loi_ms: number | null;
  phan_hoi: unknown;
}

export interface QuizAnswer {
  cau_hoi_id: string;
  lua_chon_id: string;
  ma_yeu_cau: string;
  thoi_gian_tra_loi_ms?: number;
}

export class QuizService {
  /** Chỉ thao tác trên phiên trắc nghiệm thuộc người đang đăng nhập. */
  private static async lockSession(connection: PoolConnection, userId: string, sessionId: string) {
    await lockUser(connection, userId);
    const session = await sessionForUser(connection, userId, sessionId, true);

    if (session.phuong_thuc !== 'trac_nghiem') {
      throw new AppError('Đây không phải phiên trắc nghiệm', 409, 'NOT_QUIZ_SESSION');
    }

    return session;
  }

  private static async load(connection: PoolConnection, sessionId: string) {
    const [members] = await connection.execute(
      'SELECT tu_vung_id, noi_dung_trac_nghiem FROM phien_hoc_tu WHERE phien_hoc_tap_id = ? ORDER BY thu_tu',
      [sessionId]
    );
    const [questions] = await connection.execute(
      'SELECT * FROM cau_hoi_trac_nghiem WHERE phien_hoc_tap_id = ? ORDER BY thu_tu',
      [sessionId]
    );

    return { members: members as Member[], questions: questions as Question[] };
  }

  /** Một phiên chỉ có một câu chưa trả lời; tải lại sẽ nhận đúng câu đang làm. */
  private static async state(connection: PoolConnection, session: PhienHocTap) {
    const { members, questions } = await this.load(connection, session.id);
    const answers = questions.filter((question) => question.dung !== null);
    const state = quizState(
      members.map((member) => member.tu_vung_id),
      answers as (Question & { dung: number })[]
    );
    let question = questions.find((item) => item.dung === null);

    if (!question && state.next && session.trang_thai === 'dang-hoc') {
      const word = members.find((member) => member.tu_vung_id === state.next.id)!;
      const snapshot = word.noi_dung_trac_nghiem;
      const options = shuffled(snapshot.lua_chon).map((meaning) => ({
        id: UuidUtil.generate(),
        noi_dung: meaning,
      }));
      const correct = options.find((option) => option.noi_dung === snapshot.nghia_tieng_viet)!;

      question = {
        id: UuidUtil.generate(),
        tu_vung_id: word.tu_vung_id,
        thu_tu: answers.length + 1,
        lua_chon: options,
        dap_an_dung_id: correct.id,
        dap_an_chon_id: null,
        dung: null,
        ma_yeu_cau: null,
        thoi_gian_tra_loi_ms: null,
        phan_hoi: null,
      };

      await connection.execute(
        `INSERT INTO cau_hoi_trac_nghiem
         (id, phien_hoc_tap_id, tu_vung_id, thu_tu, lua_chon, dap_an_dung_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          question.id,
          session.id,
          question.tu_vung_id,
          question.thu_tu,
          JSON.stringify(options),
          correct.id,
        ]
      );
    }

    const word = question
      ? members.find((member) => member.tu_vung_id === question.tu_vung_id)!.noi_dung_trac_nghiem
      : null;

    return {
      phien_hoc_tap_id: session.id,
      phien_ban_thuat_toan: session.phien_ban_thuat_toan,
      trang_thai: session.trang_thai,
      tong_so_tu: members.length,
      so_tu_hoan_thanh: state.items.filter((item) => item.done).length,
      so_luot_tra_loi: state.turn,
      so_luot_dung: state.correct,
      ty_le_dung: state.turn ? Math.round((state.correct * 100) / state.turn) : null,
      cau_hoi:
        question && word && session.trang_thai === 'dang-hoc'
          ? {
              id: question.id,
              tu_vung_id: question.tu_vung_id,
              thu_tu: question.thu_tu,
              tu_tieng_anh: word.tu_tieng_anh,
              phien_am: word.phien_am,
              url_am_thanh: word.url_am_thanh,
              url_hinh_anh: word.url_hinh_anh,
              lua_chon: question.lua_chon,
            }
          : null,
    };
  }

  static async getSession(userId: string, sessionId: string) {
    return transaction(async (connection) => {
      const session = await this.lockSession(connection, userId, sessionId);
      return this.state(connection, session);
    });
  }

  /** Chấm từ đáp án đã lưu; retry cùng mã không tăng lượt hoặc cập nhật SRS lần nữa. */
  static async answer(userId: string, sessionId: string, data: QuizAnswer) {
    return transaction(async (connection) => {
      const session = await this.lockSession(connection, userId, sessionId);
      const { members, questions } = await this.load(connection, sessionId);
      const repeated = questions.find((question) => question.ma_yeu_cau === data.ma_yeu_cau);

      if (repeated) {
        if (
          repeated.id !== data.cau_hoi_id ||
          repeated.dap_an_chon_id !== data.lua_chon_id ||
          repeated.thoi_gian_tra_loi_ms !== (data.thoi_gian_tra_loi_ms ?? null)
        ) {
          throw new AppError(
            'Mã yêu cầu đã được dùng với nội dung khác',
            409,
            'IDEMPOTENCY_CONFLICT'
          );
        }

        return repeated.phan_hoi;
      }

      if (session.trang_thai !== 'dang-hoc') {
        throw new AppError('Phiên học đã kết thúc', 409, 'SESSION_CLOSED');
      }

      const question = questions.find((item) => item.id === data.cau_hoi_id);
      if (!question) {
        throw new AppError('Câu hỏi không thuộc phiên học', 400, 'QUESTION_NOT_IN_SESSION');
      }
      if (question.dung !== null) {
        throw new AppError('Câu hỏi đã được trả lời', 409, 'QUESTION_ALREADY_ANSWERED');
      }
      if (!question.lua_chon.some((option) => option.id === data.lua_chon_id)) {
        throw new AppError('Đáp án không thuộc câu hỏi', 400, 'INVALID_CHOICE');
      }

      const correct = data.lua_chon_id === question.dap_an_dung_id;
      await connection.execute(
        `UPDATE cau_hoi_trac_nghiem SET dap_an_chon_id = ?, dung = ?, ma_yeu_cau = ?,
         thoi_gian_tra_loi_ms = ?, tra_loi_luc = CURRENT_TIMESTAMP(3) WHERE id = ?`,
        [data.lua_chon_id, correct, data.ma_yeu_cau, data.thoi_gian_tra_loi_ms ?? null, question.id]
      );

      const answers = questions
        .filter((item) => item.dung !== null)
        .map((item) => ({ tu_vung_id: item.tu_vung_id, dung: Boolean(item.dung) }));
      answers.push({ tu_vung_id: question.tu_vung_id, dung: correct });

      const state = quizState(
        members.map((member) => member.tu_vung_id),
        answers
      );
      const word = state.items.find((item) => item.id === question.tu_vung_id)!;

      // Mỗi từ đạt yêu cầu chỉ sinh một kết quả SRS; mọi lượt sai vẫn còn trong bảng câu hỏi.
      if (word.done) {
        const status =
          word.mistakes === 0 ? 'da-nho' : word.mistakes === 1 ? 'chua-chac' : 'chua-nho';
        await connection.execute(
          'INSERT INTO ket_qua_hoc (id, phien_hoc_tap_id, tu_vung_id, trang_thai) VALUES (?, ?, ?, ?)',
          [UuidUtil.generate(), sessionId, word.id, status]
        );
        await LearningService.updateWordProgress(connection, userId, word.id, status);
      }

      if (!state.next) {
        await LearningService.completeLockedSession(connection, session);
        session.trang_thai = 'hoan-thanh';
      }

      const response = {
        ket_qua: {
          cau_hoi_id: question.id,
          dung: correct,
          dap_an_dung_id: question.dap_an_dung_id,
          nghia_tieng_viet: members.find((member) => member.tu_vung_id === word.id)!
            .noi_dung_trac_nghiem.nghia_tieng_viet,
          tu_da_hoan_thanh: word.done,
        },
        phien: await this.state(connection, session),
      };

      await connection.execute('UPDATE cau_hoi_trac_nghiem SET phan_hoi = ? WHERE id = ?', [
        JSON.stringify(response),
        question.id,
      ]);

      return response;
    });
  }

  /** Dừng phiên nhưng giữ lại các lượt đã trả lời để xem lịch sử và thống kê. */
  static async stop(userId: string, sessionId: string) {
    return transaction(async (connection) => {
      const session = await this.lockSession(connection, userId, sessionId);

      if (session.trang_thai === 'dang-hoc') {
        await connection.execute(
          "UPDATE phien_hoc_tap SET trang_thai = 'bo-do', ket_thuc_luc = NOW() WHERE id = ?",
          [sessionId]
        );
        session.trang_thai = 'bo-do';
      }

      return this.state(connection, session);
    });
  }
}
