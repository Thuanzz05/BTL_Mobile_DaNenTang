import { query } from '../config/database';

export class ProgressService {
  static async getUserProgress(userId: string) {
    const sql = `
      SELECT 
        COUNT(DISTINCT tu_vung_id) as total_learned,
        SUM(CASE WHEN trang_thai_nho = 'thuoc-long' THEN 1 ELSE 0 END) as mastered,
        SUM(CASE WHEN trang_thai_nho = 'da-nho' THEN 1 ELSE 0 END) as remembered,
        SUM(CASE WHEN trang_thai_nho = 'chua-chac' THEN 1 ELSE 0 END) as uncertain,
        SUM(CASE WHEN trang_thai_nho = 'chua-nho' THEN 1 ELSE 0 END) as forgotten,
        SUM(CASE WHEN da_hoc = TRUE THEN 1 ELSE 0 END) as total_studied
      FROM tien_do_tu_vung
      WHERE nguoi_dung_id = ?
    `;
    
    const results: any = await query(sql, [userId]);
    return results[0] || {
      total_learned: 0,
      mastered: 0,
      remembered: 0,
      uncertain: 0,
      forgotten: 0,
      total_studied: 0
    };
  }

  static async getProgressByTopic(userId: string, topicId?: string) {
    let sql = `
      SELECT 
        c.id as topic_id,
        c.ten as topic_name,
        COUNT(t.id) as total_words,
        COUNT(CASE WHEN p.da_hoc = TRUE THEN 1 END) as learned_words,
        COUNT(CASE WHEN p.trang_thai_nho = 'thuoc-long' THEN 1 END) as mastered_words
      FROM chu_de c
      INNER JOIN tu_vung t ON c.id = t.chu_de_id
      LEFT JOIN tien_do_tu_vung p ON t.id = p.tu_vung_id AND p.nguoi_dung_id = ?
    `;
    
    const params: any[] = [userId];
    
    if (topicId) {
      sql += ` WHERE c.id = ?`;
      params.push(topicId);
    }
    
    sql += ` GROUP BY c.id, c.ten ORDER BY c.thu_tu_hien_thi`;
    
    return await query(sql, params);
  }

  static async getWordsToReview(userId: string, limit: number = 20) {
    const sql = `
      SELECT 
        t.*,
        p.trang_thai_nho,
        p.so_lan_on_tap,
        p.ngay_on_tap_tiep_theo
      FROM tien_do_tu_vung p
      INNER JOIN tu_vung t ON p.tu_vung_id = t.id
      WHERE p.nguoi_dung_id = ? 
        AND p.ngay_on_tap_tiep_theo <= NOW()
        AND p.da_hoc = TRUE
      ORDER BY p.ngay_on_tap_tiep_theo ASC
      LIMIT ?
    `;
    
    return await query(sql, [userId, limit]);
  }
}
