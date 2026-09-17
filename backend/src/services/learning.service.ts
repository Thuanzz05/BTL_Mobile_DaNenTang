import { PoolConnection } from 'mysql2/promise';
import pool, { query, transaction } from '../config/database';
import { schemas } from '../validations/request.schemas';
import { PhienHocTap, TrangThaiNhoTu } from '../types/models';
import { AppError } from '../utils/app-error';
import { nextReviewDate } from '../utils/srs.util';
import { UuidUtil } from '../utils/uuid.util';
import { QUIZ_VERSION, shuffled } from '../utils/quiz.util';

export async function lockUser(connection: PoolConnection, userId: string) {
  const [users]: any = await connection.execute(
    'SELECT id, trang_thai FROM nguoi_dung WHERE id = ? FOR UPDATE',
    [userId]
  );
  if (!users[0] || users[0].trang_thai !== 'active') {
    throw new AppError('Tài khoản không hoạt động', 403, 'ACCOUNT_DISABLED');
  }
}

export async function sessionForUser(
  connection: PoolConnection,
  userId: string,
  sessionId: string,
  lock = false
): Promise<PhienHocTap> {
  const [sessions]: any = await connection.execute(
    'SELECT * FROM phien_hoc_tap WHERE id = ? AND nguoi_dung_id = ?' + (lock ? ' FOR UPDATE' : ''),
    [sessionId, userId]
  );
  if (!sessions[0]) {
    throw new AppError('Phiên học không tồn tại', 404, 'SESSION_NOT_FOUND');
  }
  return sessions[0];
}

async function withExamples(words: any[], connection?: PoolConnection) {
  if (!words.length) {
    return [];
  }
  const sql =
    'SELECT * FROM vi_du WHERE tu_vung_id IN (' +
    words.map(() => '?').join(',') +
    ') ORDER BY thu_tu_hien_thi, id';
  const [examples]: any = await (connection || pool).query(
    sql,
    words.map((word) => word.id)
  );
  return words.map((word) => ({
    ...word,
    vi_du: examples.filter((example: any) => example.tu_vung_id === word.id),
  }));
}

const dueSql = `FROM tien_do_tu_vung p
  INNER JOIN tu_vung t ON p.tu_vung_id = t.id AND t.trang_thai = 'active'
  INNER JOIN chu_de c ON t.chu_de_id = c.id AND c.trang_thai = 'active'
  WHERE p.nguoi_dung_id = ? AND p.da_hoc = TRUE AND p.ngay_on_tap_tiep_theo <= NOW()`;

export class LearningService {
  /** Gọi sau lockUser: cùng mã khởi tạo luôn trả về cùng một phiên. */
  private static async replayStart(
    connection: PoolConnection,
    userId: string,
    topicId: string | null,
    wordCount: number,
    method: string,
    requestId?: string
  ) {
    if (!requestId) {
      return null;
    }
    const [sessions]: any = await connection.execute(
      `SELECT p.*, c.ten AS chu_de_ten, c.hinh_anh AS chu_de_hinh_anh
       FROM phien_hoc_tap p LEFT JOIN chu_de c ON c.id = p.chu_de_id
       WHERE p.nguoi_dung_id = ? AND p.ma_yeu_cau_khoi_tao = ?`,
      [userId, requestId]
    );
    const session = sessions[0];
    if (!session) {
      return null;
    }
    if (
      session.chu_de_id !== topicId ||
      session.so_tu_yeu_cau !== wordCount ||
      session.phuong_thuc !== method ||
      session.loai_phien !== (topicId ? 'hoc_moi' : 'on_tap')
    ) {
      throw new AppError('Mã khởi tạo đã được dùng cho bài khác', 409, 'IDEMPOTENCY_CONFLICT');
    }
    const [words]: any = await connection.execute(
      `SELECT t.* FROM phien_hoc_tu p JOIN tu_vung t ON t.id = p.tu_vung_id
       WHERE p.phien_hoc_tap_id = ? ORDER BY p.thu_tu`,
      [session.id]
    );
    return {
      phien_hoc_tap_id: session.id as string,
      phien_hoc_tap: session,
      danh_sach_tu: await withExamples(words, connection),
    };
  }

  /**
   * Lưu phiên học cùng danh sách từ và thứ tự cố định
   */
  private static async createSession(
    connection: PoolConnection,
    userId: string,
    topicId: string | null,
    words: any[],
    type: 'hoc_moi' | 'on_tap',
    method: 'danh_gia' | 'trac_nghiem',
    requestId?: string,
    requestedCount?: number
  ) {
    const id = UuidUtil.generate();
    await connection.execute(
      `INSERT INTO phien_hoc_tap (
        id, nguoi_dung_id, chu_de_id, tong_so_tu, loai_phien, phuong_thuc, phien_ban_thuat_toan,
        ma_yeu_cau_khoi_tao, so_tu_yeu_cau
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        topicId,
        words.length,
        type,
        method,
        method === 'trac_nghiem' ? QUIZ_VERSION : null,
        requestId || null,
        requestedCount ?? null,
      ]
    );
    await connection.query(
      'INSERT INTO phien_hoc_tu (phien_hoc_tap_id, tu_vung_id, thu_tu) VALUES ?',
      [words.map((word, index) => [id, word.id, index])]
    );

    // Chụp nội dung và đáp án tại thời điểm bắt đầu để việc sửa từ không đổi kết quả chấm.
    if (method === 'trac_nghiem') {
      const [catalog]: any = await connection.query(
        `SELECT DISTINCT TRIM(t.nghia_tieng_viet) AS nghia FROM tu_vung t
         JOIN chu_de c ON c.id = t.chu_de_id AND c.trang_thai = 'active'
         WHERE t.trang_thai = 'active'
         ORDER BY RAND() LIMIT 200`
      );
      const meanings = [
        ...new Set<string>([
          ...words.map((word) => word.nghia_tieng_viet.trim()),
          ...catalog.map((word: any) => word.nghia),
        ]),
      ];

      if (meanings.length < 2) {
        throw new AppError(
          'Cần ít nhất hai nghĩa khác nhau để tạo câu hỏi',
          409,
          'INSUFFICIENT_CHOICES'
        );
      }

      for (const word of words) {
        const meaning = word.nghia_tieng_viet.trim();
        const snapshot = {
          tu_tieng_anh: word.tu_tieng_anh,
          phien_am: word.phien_am,
          url_am_thanh: word.url_am_thanh,
          url_hinh_anh: word.url_hinh_anh,
          nghia_tieng_viet: meaning,
          lua_chon: [
            meaning,
            ...shuffled(meanings.filter((value) => value !== meaning)).slice(0, 3),
          ],
        };

        await connection.execute(
          'UPDATE phien_hoc_tu SET noi_dung_trac_nghiem = ? WHERE phien_hoc_tap_id = ? AND tu_vung_id = ?',
          [JSON.stringify(snapshot), id, word.id]
        );
      }
    }
    const [sessions]: any = await connection.execute(
      `SELECT p.*, c.ten AS chu_de_ten, c.hinh_anh AS chu_de_hinh_anh FROM phien_hoc_tap p
       LEFT JOIN chu_de c ON p.chu_de_id = c.id WHERE p.id = ?`,
      [id]
    );

    return {
      phien_hoc_tap_id: id,
      phien_hoc_tap: sessions[0],
      danh_sach_tu: await withExamples(words, connection),
    };
  }

  /**
   * Bắt đầu học theo chủ đề, ưu tiên từ chưa học
   */
  static async startSession(
    userId: string,
    topicId: string,
    wordCount = 20,
    method: 'danh_gia' | 'trac_nghiem' = 'danh_gia',
    requestId?: string
  ) {
    schemas.start.parse({ chu_de_id: topicId, tong_so_tu: wordCount });

    return transaction(async (connection) => {
      await lockUser(connection, userId);
      const replay = await this.replayStart(
        connection,
        userId,
        topicId,
        wordCount,
        method,
        requestId
      );
      if (replay) {
        return replay;
      }
      const [topics]: any = await connection.execute(
        "SELECT id FROM chu_de WHERE id = ? AND trang_thai = 'active' FOR UPDATE",
        [topicId]
      );
      if (!topics.length) {
        throw new AppError('Chủ đề không tồn tại hoặc đã bị ẩn', 404, 'TOPIC_NOT_FOUND');
      }
      const [words]: any = await connection.query(
        `SELECT t.* FROM tu_vung t LEFT JOIN tien_do_tu_vung p ON t.id = p.tu_vung_id AND p.nguoi_dung_id = ?
         WHERE t.chu_de_id = ? AND t.trang_thai = 'active'
         ORDER BY COALESCE(p.da_hoc, FALSE), RAND() LIMIT ? FOR SHARE`,
        [userId, topicId, wordCount]
      );
      if (words.length < 5) {
        throw new AppError(
          'Chủ đề cần ít nhất 5 từ đang hiển thị để học',
          409,
          'INSUFFICIENT_WORDS'
        );
      }
      return this.createSession(
        connection,
        userId,
        topicId,
        words,
        'hoc_moi',
        method,
        requestId,
        wordCount
      );
    });
  }

  /**
   * Tạo phiên ôn từ các từ đến hạn, có thể thuộc nhiều chủ đề
   */
  static async startReviewSession(
    userId: string,
    wordCount = 50,
    method: 'danh_gia' | 'trac_nghiem' = 'danh_gia',
    requestId?: string
  ) {
    schemas.review.parse({ tong_so_tu: wordCount });

    return transaction(async (connection) => {
      await lockUser(connection, userId);
      const replay = await this.replayStart(connection, userId, null, wordCount, method, requestId);
      if (replay) {
        return replay;
      }
      const [words]: any = await connection.query(
        'SELECT t.* ' + dueSql + ' ORDER BY p.ngay_on_tap_tiep_theo, t.id LIMIT ? FOR SHARE',
        [userId, wordCount]
      );
      if (!words.length) {
        throw new AppError('Không có từ đến hạn ôn tập', 404, 'NO_REVIEW_WORDS');
      }
      return this.createSession(
        connection,
        userId,
        null,
        words,
        'on_tap',
        method,
        requestId,
        wordCount
      );
    });
  }

  /**
   * Ghi nhận một đánh giá duy nhất cho mỗi từ trong phiên học
   */
  static async submitResult(userId: string, sessionId: string, wordId: string, status: string) {
    const data = schemas.result.parse({
      phien_hoc_tap_id: sessionId,
      tu_vung_id: wordId,
      trang_thai: status,
    });

    return transaction(async (connection) => {
      // Khóa người học để các lần gửi đồng thời không cộng tiến độ hai lần.
      await lockUser(connection, userId);
      const session = await sessionForUser(connection, userId, sessionId, true);

      if (session.phuong_thuc === 'trac_nghiem') {
        throw new AppError(
          'Phiên trắc nghiệm phải nộp đáp án qua API quiz',
          409,
          'QUIZ_ANSWER_REQUIRED'
        );
      }
      const [members]: any = await connection.execute(
        'SELECT tu_vung_id FROM phien_hoc_tu WHERE phien_hoc_tap_id = ? AND tu_vung_id = ?',
        [sessionId, wordId]
      );
      if (!members.length) {
        throw new AppError('Từ không thuộc danh sách của phiên học', 400, 'WORD_NOT_IN_SESSION');
      }
      const [existing]: any = await connection.execute(
        'SELECT trang_thai FROM ket_qua_hoc WHERE phien_hoc_tap_id = ? AND tu_vung_id = ?',
        [sessionId, wordId]
      );
      if (existing.length) {
        if (existing[0].trang_thai === data.trang_thai) {
          return { success: true, replayed: true };
        }
        throw new AppError(
          'Từ này đã được đánh giá. Hãy tạo phiên ôn mới để đánh giá lại',
          409,
          'RESULT_ALREADY_SUBMITTED'
        );
      }
      if (session.trang_thai !== 'dang-hoc') {
        throw new AppError('Phiên học đã kết thúc', 409, 'SESSION_CLOSED');
      }
      await connection.execute(
        'INSERT INTO ket_qua_hoc (id, phien_hoc_tap_id, tu_vung_id, trang_thai) VALUES (?, ?, ?, ?)',
        [UuidUtil.generate(), sessionId, wordId, data.trang_thai]
      );
      await this.updateWordProgress(connection, userId, wordId, data.trang_thai);
      return { success: true, replayed: false };
    });
  }

  /**
   * Cập nhật số lần ôn và lịch SRS trong giao dịch lưu kết quả
   */
  static async updateWordProgress(
    connection: PoolConnection,
    userId: string,
    wordId: string,
    status: TrangThaiNhoTu
  ) {
    const [existing]: any = await connection.execute(
      'SELECT so_lan_on_tap FROM tien_do_tu_vung WHERE nguoi_dung_id = ? AND tu_vung_id = ? FOR UPDATE',
      [userId, wordId]
    );

    const count = Number(existing[0]?.so_lan_on_tap || 0) + 1;

    // Đồng bộ cờ yêu thích cả khi đây là lần đầu tạo bản ghi tiến độ
    const [favorites]: any = await connection.execute(
      'SELECT id FROM yeu_thich WHERE nguoi_dung_id = ? AND tu_vung_id = ?',
      [userId, wordId]
    );

    await connection.execute(
      `INSERT INTO tien_do_tu_vung (
         nguoi_dung_id, tu_vung_id, da_hoc, yeu_thich, trang_thai_nho,
         so_lan_on_tap, lan_on_tap_cuoi, ngay_on_tap_tiep_theo
       )
       VALUES (?, ?, TRUE, ?, ?, ?, NOW(), IF(? = 'chua-nho', NOW(), ?))
       ON DUPLICATE KEY UPDATE
         da_hoc = TRUE,
         yeu_thich = VALUES(yeu_thich),
         trang_thai_nho = VALUES(trang_thai_nho),
         so_lan_on_tap = VALUES(so_lan_on_tap),
         lan_on_tap_cuoi = NOW(),
         ngay_on_tap_tiep_theo = VALUES(ngay_on_tap_tiep_theo)`,
      [userId, wordId, favorites.length > 0, status, count, status, nextReviewDate(status, count)]
    );
  }

  /**
   * Chỉ hoàn thành khi đã đánh giá đủ từ; gửi lặp không ghi hoạt động lần nữa
   */
  static async completeSession(userId: string, sessionId: string) {
    return transaction(async (connection) => {
      await lockUser(connection, userId);
      const session = await sessionForUser(connection, userId, sessionId, true);
      return this.completeLockedSession(connection, session);
    });
  }

  /** Hoàn tất trên cùng giao dịch đã khóa người học và phiên. */
  static async completeLockedSession(connection: PoolConnection, session: PhienHocTap) {
    const sessionId = session.id;
    const userId = session.nguoi_dung_id;
    const [results]: any = await connection.execute(
      'SELECT * FROM ket_qua_hoc WHERE phien_hoc_tap_id = ?',
      [sessionId]
    );
    if (session.trang_thai === 'hoan-thanh') {
      return this.summarize(session, results);
    }
    if (session.trang_thai !== 'dang-hoc') {
      throw new AppError('Phiên học đã kết thúc', 409, 'SESSION_CLOSED');
    }
    const [members]: any = await connection.execute(
      'SELECT COUNT(*) AS count FROM phien_hoc_tu WHERE phien_hoc_tap_id = ?',
      [sessionId]
    );
    if (Number(members[0].count) !== session.tong_so_tu) {
      throw new AppError(
        'Phiên học cũ thiếu danh sách từ. Vui lòng bắt đầu phiên mới',
        409,
        'LEGACY_SESSION'
      );
    }
    if (results.length !== session.tong_so_tu) {
      throw new AppError(
        'Phải đánh giá tất cả các từ trước khi hoàn thành',
        409,
        'SESSION_INCOMPLETE'
      );
    }
    await connection.execute(
      "UPDATE phien_hoc_tap SET trang_thai = 'hoan-thanh', ket_thuc_luc = NOW() WHERE id = ?",
      [sessionId]
    );
    await connection.execute(
      'INSERT INTO hoat_dong_hoc_tap (id, nguoi_dung_id, loai_hoat_dong, mo_ta) VALUES (?, ?, ?, ?)',
      [
        UuidUtil.generate(),
        userId,
        session.loai_phien === 'on_tap' ? 'on_tap' : 'hoan_thanh_session',
        'Hoàn thành phiên ' + sessionId,
      ]
    );
    return this.summarize(session, results);
  }

  /**
   * Tổng hợp kết quả theo tổng số từ đã chọn cho phiên
   */
  private static summarize(session: PhienHocTap, results: any[]) {
    const da_nho = results.filter((result) => result.trang_thai === 'da-nho').length;

    return {
      phien_hoc_tap_id: session.id,
      tong_so_tu: session.tong_so_tu,
      so_tu_da_danh_gia: results.length,
      da_nho,
      chua_chac: results.filter((result) => result.trang_thai === 'chua-chac').length,
      chua_nho: results.filter((result) => result.trang_thai === 'chua-nho').length,
      ty_le: session.tong_so_tu ? Math.round((100 * da_nho) / session.tong_so_tu) : 0,
    };
  }

  /**
   * Lấy kết quả và danh sách từ đã lưu để mobile tiếp tục phiên học
   */
  static async getSessionResult(userId: string, sessionId: string) {
    return transaction(async (connection) => {
      const session = await sessionForUser(connection, userId, sessionId);
      const [results]: any = await connection.execute(
        `SELECT k.*, t.tu_tieng_anh, t.phien_am, t.nghia_tieng_viet, t.url_hinh_anh FROM ket_qua_hoc k
         JOIN tu_vung t ON k.tu_vung_id = t.id WHERE k.phien_hoc_tap_id = ? ORDER BY k.ngay_tao, k.id`,
        [sessionId]
      );
      const [words]: any = await connection.execute(
        `SELECT t.*, k.trang_thai FROM phien_hoc_tu p JOIN tu_vung t ON p.tu_vung_id = t.id
         LEFT JOIN ket_qua_hoc k ON k.phien_hoc_tap_id = p.phien_hoc_tap_id AND k.tu_vung_id = p.tu_vung_id
         WHERE p.phien_hoc_tap_id = ? ORDER BY p.thu_tu`,
        [sessionId]
      );
      return {
        phien_hoc_tap: session,
        ...this.summarize(session, results),
        ket_qua: results,
        danh_sach_tu_chua_nho: results.filter((result: any) => result.trang_thai === 'chua-nho'),
        danh_sach_tu: await withExamples(words, connection),
      };
    });
  }

  /**
   * Lấy từ đến hạn ôn và tổng số từ cần ôn trước khi giới hạn danh sách
   */
  static async getReviewWords(userId: string, limit = 50) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      throw new AppError('Giới hạn ôn tập phải từ 1 đến 50');
    }

    const words = await query<any[]>(
      'SELECT t.*, p.trang_thai_nho, p.so_lan_on_tap, p.ngay_on_tap_tiep_theo ' +
        dueSql +
        ' ORDER BY p.ngay_on_tap_tiep_theo, t.id LIMIT ?',
      [userId, limit]
    );

    const counts = await query<any[]>('SELECT COUNT(*) AS count ' + dueSql, [userId]);

    return { so_tu_can_on: Number(counts[0].count), danh_sach_tu: await withExamples(words) };
  }
}
