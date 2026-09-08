import { query } from '../config/database';

export class HistoryService {
  static async getUserHistory(userId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;
    
    const sql = `
      SELECT 
        p.*,
        c.ten as topic_name,
        c.hinh_anh as topic_image,
        COUNT(k.id) as total_results,
        SUM(CASE WHEN k.trang_thai = 'da-nho' THEN 1 ELSE 0 END) as remembered_count,
        SUM(CASE WHEN k.trang_thai = 'chua-chac' THEN 1 ELSE 0 END) as uncertain_count,
        SUM(CASE WHEN k.trang_thai = 'chua-nho' THEN 1 ELSE 0 END) as forgotten_count
      FROM phien_hoc_tap p
      INNER JOIN chu_de c ON p.chu_de_id = c.id
      LEFT JOIN ket_qua_hoc k ON p.id = k.phien_hoc_tap_id
      WHERE p.nguoi_dung_id = ?
      GROUP BY p.id
      ORDER BY p.bat_dau_luc DESC
      LIMIT ? OFFSET ?
    `;
    
    const sessions: any = await query(sql, [userId, limit, offset]);
    
    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM phien_hoc_tap WHERE nguoi_dung_id = ?`;
    const countResult: any = await query(countSql, [userId]);
    const total = countResult[0]?.total || 0;
    
    return {
      sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getSessionDetail(sessionId: string, userId: string) {
    const sessionSql = `
      SELECT 
        p.*,
        c.ten as topic_name,
        c.hinh_anh as topic_image
      FROM phien_hoc_tap p
      INNER JOIN chu_de c ON p.chu_de_id = c.id
      WHERE p.id = ? AND p.nguoi_dung_id = ?
    `;
    
    const sessions: any = await query(sessionSql, [sessionId, userId]);
    const session = sessions[0];
    
    if (!session) {
      throw new Error('Phiên học không tồn tại hoặc không thuộc về người dùng này');
    }
    
    const resultsSql = `
      SELECT 
        k.*,
        t.tu_tieng_anh,
        t.nghia_tieng_viet,
        t.phien_am,
        t.url_hinh_anh
      FROM ket_qua_hoc k
      INNER JOIN tu_vung t ON k.tu_vung_id = t.id
      WHERE k.phien_hoc_tap_id = ?
      ORDER BY k.ngay_tao
    `;
    
    const results = await query(resultsSql, [sessionId]);
    
    return {
      ...session,
      results
    };
  }
}
