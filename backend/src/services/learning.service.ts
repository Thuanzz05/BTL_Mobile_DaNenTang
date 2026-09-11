import { query } from '../config/database';
import { UuidUtil } from '../utils/uuid.util';

export class LearningService {
  /**
   * Bắt đầu phiên học mới
   */
  static async startSession(userId: string, topicId: string, wordCount: number = 20) {
    // Validate wordCount
    if (wordCount < 5 || wordCount > 50) {
      throw new Error('Số từ mỗi phiên phải từ 5 đến 50');
    }

    // Lấy từ vựng của chủ đề (ưu tiên từ chưa học)
    const wordsSql = `
      SELECT t.*
      FROM tu_vung t
      LEFT JOIN tien_do_tu_vung p ON t.id = p.tu_vung_id AND p.nguoi_dung_id = ?
      WHERE t.chu_de_id = ?
      ORDER BY p.da_hoc ASC, RAND()
      LIMIT ?
    `;

    const words: any[] = await query(wordsSql, [userId, topicId, wordCount]);

    if (words.length === 0) {
      throw new Error('Chủ đề này chưa có từ vựng');
    }

    if (words.length < 5) {
      throw new Error('Chủ đề cần ít nhất 5 từ để học');
    }

    // Tạo phiên học
    const sessionId = UuidUtil.generate();
    await query(
      `INSERT INTO phien_hoc_tap (id, nguoi_dung_id, chu_de_id, tong_so_tu, trang_thai)
       VALUES (?, ?, ?, ?, 'dang-hoc')`,
      [sessionId, userId, topicId, words.length]
    );

    // Lấy thông tin phiên kèm chủ đề
    const sessions: any[] = await query(
      `SELECT p.*, c.ten as chu_de_ten, c.hinh_anh as chu_de_hinh_anh
       FROM phien_hoc_tap p
       INNER JOIN chu_de c ON p.chu_de_id = c.id
       WHERE p.id = ?`,
      [sessionId]
    );

    // Lấy ví dụ cho từng từ
    const wordsWithExamples = await Promise.all(
      words.map(async (w) => {
        const examples: any[] = await query(
          'SELECT * FROM vi_du WHERE tu_vung_id = ? ORDER BY thu_tu_hien_thi ASC LIMIT 2',
          [w.id]
        );
        return { ...w, vi_du: examples };
      })
    );

    return {
      phien_hoc_tap: sessions[0],
      danh_sach_tu: wordsWithExamples,
    };
  }

  /**
   * Nộp kết quả từng từ - áp dụng SRS
   */
  static async submitResult(userId: string, sessionId: string, wordId: string, status: string) {
    // Validate phiên học thuộc user
    const sessions: any[] = await query(
      'SELECT * FROM phien_hoc_tap WHERE id = ? AND nguoi_dung_id = ?',
      [sessionId, userId]
    );

    if (sessions.length === 0) {
      throw new Error('Phiên học không hợp lệ');
    }

    const session = sessions[0];
    if (session.trang_thai !== 'dang-hoc') {
      throw new Error('Phiên học đã kết thúc');
    }

    // Lưu kết quả (có thể đã có - cập nhật lại)
    const existingResult: any[] = await query(
      'SELECT id FROM ket_qua_hoc WHERE phien_hoc_tap_id = ? AND tu_vung_id = ?',
      [sessionId, wordId]
    );

    if (existingResult.length > 0) {
      await query(
        'UPDATE ket_qua_hoc SET trang_thai = ? WHERE id = ?',
        [status, existingResult[0].id]
      );
    } else {
      const resultId = UuidUtil.generate();
      await query(
        `INSERT INTO ket_qua_hoc (id, phien_hoc_tap_id, tu_vung_id, trang_thai)
         VALUES (?, ?, ?, ?)`,
        [resultId, sessionId, wordId, status]
      );
    }

    // Cập nhật tiến độ SRS
    await this.updateWordProgress(userId, wordId, status);

    return { success: true };
  }

  /**
   * Hoàn thành phiên học
   */
  static async completeSession(userId: string, sessionId: string) {
    const sessions: any[] = await query(
      'SELECT * FROM phien_hoc_tap WHERE id = ? AND nguoi_dung_id = ?',
      [sessionId, userId]
    );

    if (sessions.length === 0) {
      throw new Error('Phiên học không hợp lệ');
    }

    // Cập nhật trạng thái
    await query(
      `UPDATE phien_hoc_tap
       SET trang_thai = 'hoan-thanh', ket_thuc_luc = NOW()
       WHERE id = ?`,
      [sessionId]
    );

    // Lấy thống kê kết quả
    const stats: any[] = await query(
      `SELECT
         COUNT(*) as tong_so_tu,
         SUM(CASE WHEN trang_thai = 'da-nho' THEN 1 ELSE 0 END) as da_nho,
         SUM(CASE WHEN trang_thai = 'chua-chac' THEN 1 ELSE 0 END) as chua_chac,
         SUM(CASE WHEN trang_thai = 'chua-nho' THEN 1 ELSE 0 END) as chua_nho
       FROM ket_qua_hoc
       WHERE phien_hoc_tap_id = ?`,
      [sessionId]
    );

    const stat = stats[0];
    const ty_le = stat.tong_so_tu > 0
      ? Math.round((stat.da_nho / stat.tong_so_tu) * 100)
      : 0;

    return {
      phien_hoc_tap_id: sessionId,
      tong_so_tu: stat.tong_so_tu,
      da_nho: stat.da_nho,
      chua_chac: stat.chua_chac,
      chua_nho: stat.chua_nho,
      ty_le,
    };
  }

  /**
   * Lấy kết quả chi tiết phiên học
   */
  static async getSessionResult(userId: string, sessionId: string) {
    const sessions: any[] = await query(
      `SELECT p.*, c.ten as chu_de_ten
       FROM phien_hoc_tap p
       INNER JOIN chu_de c ON p.chu_de_id = c.id
       WHERE p.id = ? AND p.nguoi_dung_id = ?`,
      [sessionId, userId]
    );

    if (sessions.length === 0) {
      throw new Error('Phiên học không tồn tại');
    }

    // Kết quả từng từ
    const results: any[] = await query(
      `SELECT k.*, t.tu_tieng_anh, t.phien_am, t.nghia_tieng_viet, t.url_hinh_anh
       FROM ket_qua_hoc k
       INNER JOIN tu_vung t ON k.tu_vung_id = t.id
       WHERE k.phien_hoc_tap_id = ?`,
      [sessionId]
    );

    const da_nho = results.filter(r => r.trang_thai === 'da-nho').length;
    const chua_chac = results.filter(r => r.trang_thai === 'chua-chac').length;
    const chua_nho = results.filter(r => r.trang_thai === 'chua-nho').length;
    const ty_le = results.length > 0 ? Math.round((da_nho / results.length) * 100) : 0;

    return {
      phien_hoc_tap: sessions[0],
      tong_so_tu: results.length,
      da_nho,
      chua_chac,
      chua_nho,
      ty_le,
      danh_sach_tu_chua_nho: results.filter(r => r.trang_thai === 'chua-nho'),
      ket_qua: results,
    };
  }

  /**
   * Lấy từ cần ôn tập theo SRS
   */
  static async getReviewWords(userId: string, limit: number = 50) {
    const words: any[] = await query(
      `SELECT t.*, p.trang_thai_nho, p.so_lan_on_tap, p.ngay_on_tap_tiep_theo
       FROM tien_do_tu_vung p
       INNER JOIN tu_vung t ON p.tu_vung_id = t.id
       WHERE p.nguoi_dung_id = ?
         AND p.trang_thai_nho IN ('chua-nho', 'chua-chac')
         AND p.ngay_on_tap_tiep_theo <= NOW()
         AND p.da_hoc = TRUE
       ORDER BY p.ngay_on_tap_tiep_theo ASC
       LIMIT ?`,
      [userId, limit]
    );

    // Lấy ví dụ cho từng từ
    const wordsWithExamples = await Promise.all(
      words.map(async (w) => {
        const examples: any[] = await query(
          'SELECT * FROM vi_du WHERE tu_vung_id = ? ORDER BY thu_tu_hien_thi ASC LIMIT 2',
          [w.id]
        );
        return { ...w, vi_du: examples };
      })
    );

    return {
      so_tu_can_on: words.length,
      danh_sach_tu: wordsWithExamples,
    };
  }

  /**
   * Cập nhật tiến độ từ theo thuật toán SRS
   */
  private static async updateWordProgress(userId: string, wordId: string, status: string) {
    const existing: any[] = await query(
      'SELECT * FROM tien_do_tu_vung WHERE nguoi_dung_id = ? AND tu_vung_id = ?',
      [userId, wordId]
    );

    const reviewCount = existing[0]?.so_lan_on_tap || 0;
    const nextReviewDate = this.calculateNextReviewDate(status, reviewCount + 1);

    if (existing.length > 0) {
      await query(
        `UPDATE tien_do_tu_vung
         SET da_hoc = TRUE,
             trang_thai_nho = ?,
             so_lan_on_tap = so_lan_on_tap + 1,
             lan_on_tap_cuoi = NOW(),
             ngay_on_tap_tiep_theo = ?
         WHERE nguoi_dung_id = ? AND tu_vung_id = ?`,
        [status, nextReviewDate, userId, wordId]
      );
    } else {
      await query(
        `INSERT INTO tien_do_tu_vung
           (nguoi_dung_id, tu_vung_id, da_hoc, trang_thai_nho, so_lan_on_tap, lan_on_tap_cuoi, ngay_on_tap_tiep_theo)
         VALUES (?, ?, TRUE, ?, 1, NOW(), ?)`,
        [userId, wordId, status, nextReviewDate]
      );
    }
  }

  /**
   * Tính ngày ôn tập tiếp theo theo SRS (theo nghiệp vụ NGHIEP_VU_CHI_TIET.md)
   */
  private static calculateNextReviewDate(status: string, reviewCount: number): Date {
    const now = new Date();
    let days = 0;

    switch (status) {
      case 'da-nho':
        // Ôn lại sau lâu hơn dần
        if (reviewCount === 1) days = 1;
        else if (reviewCount === 2) days = 3;
        else if (reviewCount === 3) days = 7;
        else if (reviewCount === 4) days = 14;
        else days = 30;
        break;

      case 'chua-chac':
        // Ôn lại sau 1 ngày
        days = 1;
        break;

      case 'chua-nho':
        // Ôn lại ngay hôm nay
        days = 0;
        break;

      default:
        days = 1;
    }

    now.setDate(now.getDate() + days);
    return now;
  }
}
