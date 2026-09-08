import { query } from '../config/database';
import { UuidUtil } from '../utils/uuid.util';

export class LearningService {
  static async startSession(userId: string, topicId: string, wordCount: number = 10) {
    const sessionId = UuidUtil.generate();
    
    // Get random words from topic
    const wordsSql = `
      SELECT * FROM tu_vung
      WHERE chu_de_id = ?
      ORDER BY RAND()
      LIMIT ?
    `;
    
    const words: any = await query(wordsSql, [topicId, wordCount]);
    
    if (words.length === 0) {
      throw new Error('Chủ đề này chưa có từ vựng');
    }
    
    // Create session
    const createSessionSql = `
      INSERT INTO phien_hoc_tap (id, nguoi_dung_id, chu_de_id, tong_so_tu, trang_thai)
      VALUES (?, ?, ?, ?, 'dang-hoc')
    `;
    
    await query(createSessionSql, [sessionId, userId, topicId, words.length]);
    
    // Get session with topic info
    const sessionSql = `
      SELECT p.*, c.ten as topic_name
      FROM phien_hoc_tap p
      INNER JOIN chu_de c ON p.chu_de_id = c.id
      WHERE p.id = ?
    `;
    
    const sessions: any = await query(sessionSql, [sessionId]);
    
    return {
      session: sessions[0],
      words
    };
  }

  static async submitResult(userId: string, sessionId: string, wordId: string, status: string) {
    // Validate session belongs to user
    const sessionSql = `SELECT * FROM phien_hoc_tap WHERE id = ? AND nguoi_dung_id = ?`;
    const sessions: any = await query(sessionSql, [sessionId, userId]);
    
    if (sessions.length === 0) {
      throw new Error('Phiên học không hợp lệ');
    }
    
    const session = sessions[0];
    
    if (session.trang_thai !== 'dang-hoc') {
      throw new Error('Phiên học đã kết thúc');
    }
    
    // Save result
    const resultId = UuidUtil.generate();
    const insertResultSql = `
      INSERT INTO ket_qua_hoc (id, phien_hoc_tap_id, tu_vung_id, trang_thai)
      VALUES (?, ?, ?, ?)
    `;
    
    await query(insertResultSql, [resultId, sessionId, wordId, status]);
    
    // Update or create progress
    await this.updateWordProgress(userId, wordId, status);
    
    return { success: true };
  }

  static async completeSession(userId: string, sessionId: string) {
    // Validate session
    const sessionSql = `SELECT * FROM phien_hoc_tap WHERE id = ? AND nguoi_dung_id = ?`;
    const sessions: any = await query(sessionSql, [sessionId, userId]);
    
    if (sessions.length === 0) {
      throw new Error('Phiên học không hợp lệ');
    }
    
    // Update session status
    const updateSql = `
      UPDATE phien_hoc_tap
      SET trang_thai = 'hoan-thanh', ket_thuc_luc = NOW()
      WHERE id = ?
    `;
    
    await query(updateSql, [sessionId]);
    
    // Get statistics
    const statsSql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN trang_thai = 'da-nho' THEN 1 ELSE 0 END) as remembered,
        SUM(CASE WHEN trang_thai = 'chua-chac' THEN 1 ELSE 0 END) as uncertain,
        SUM(CASE WHEN trang_thai = 'chua-nho' THEN 1 ELSE 0 END) as forgotten
      FROM ket_qua_hoc
      WHERE phien_hoc_tap_id = ?
    `;
    
    const stats: any = await query(statsSql, [sessionId]);
    
    return {
      success: true,
      statistics: stats[0]
    };
  }

  private static async updateWordProgress(userId: string, wordId: string, status: string) {
    // Check if progress exists
    const checkSql = `
      SELECT * FROM tien_do_tu_vung
      WHERE nguoi_dung_id = ? AND tu_vung_id = ?
    `;
    
    const existing: any = await query(checkSql, [userId, wordId]);
    
    // Calculate next review date based on SRS
    const nextReviewDate = this.calculateNextReview(status, existing[0]?.so_lan_on_tap || 0);
    
    if (existing.length > 0) {
      // Update existing progress
      const updateSql = `
        UPDATE tien_do_tu_vung
        SET 
          da_hoc = TRUE,
          trang_thai_nho = ?,
          so_lan_on_tap = so_lan_on_tap + 1,
          lan_on_tap_cuoi = NOW(),
          ngay_on_tap_tiep_theo = ?
        WHERE nguoi_dung_id = ? AND tu_vung_id = ?
      `;
      
      await query(updateSql, [status, nextReviewDate, userId, wordId]);
    } else {
      // Create new progress
      const insertSql = `
        INSERT INTO tien_do_tu_vung (
          nguoi_dung_id, tu_vung_id, da_hoc, trang_thai_nho,
          so_lan_on_tap, lan_on_tap_cuoi, ngay_on_tap_tiep_theo
        ) VALUES (?, ?, TRUE, ?, 1, NOW(), ?)
      `;
      
      await query(insertSql, [userId, wordId, status, nextReviewDate]);
    }
  }

  private static calculateNextReview(status: string, reviewCount: number): Date {
    const now = new Date();
    let daysToAdd = 1;
    
    // Simple SRS algorithm
    switch (status) {
      case 'chua-nho': // Forgotten - review tomorrow
        daysToAdd = 1;
        break;
      case 'chua-chac': // Uncertain - review in 2 days
        daysToAdd = 2;
        break;
      case 'da-nho': // Remembered - review based on count
        daysToAdd = Math.min(Math.pow(2, reviewCount), 30); // Max 30 days
        break;
      case 'thuoc-long': // Mastered - review in 30 days
        daysToAdd = 30;
        break;
      default:
        daysToAdd = 1;
    }
    
    now.setDate(now.getDate() + daysToAdd);
    return now;
  }
}
