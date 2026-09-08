import { query } from '../config/database';

export class TopicService {
  static async getAllTopics(status?: string) {
    let sql = `
      SELECT t.*, 
        (SELECT COUNT(*) FROM tu_vung WHERE chu_de_id = t.id) as word_count
      FROM chu_de t
    `;
    
    const params: any[] = [];
    if (status) {
      sql += ` WHERE trang_thai = ?`;
      params.push(status);
    }
    
    sql += ` ORDER BY thu_tu_hien_thi ASC`;
    
    return await query(sql, params);
  }

  static async getTopicById(id: string) {
    const sql = `
      SELECT t.*,
        (SELECT COUNT(*) FROM tu_vung WHERE chu_de_id = t.id) as word_count
      FROM chu_de t
      WHERE t.id = ?
    `;
    
    const results: any = await query(sql, [id]);
    return results[0] || null;
  }

  static async createTopic(data: any) {
    const { id, ten, mo_ta, hinh_anh, trang_thai, thu_tu_hien_thi } = data;
    const sql = `
      INSERT INTO chu_de (id, ten, mo_ta, hinh_anh, trang_thai, thu_tu_hien_thi)
      VALUES (UUID(), ?, ?, ?, ?, ?)
    `;
    
    await query(sql, [ten, mo_ta || null, hinh_anh || null, trang_thai || 'active', thu_tu_hien_thi || 0]);
    
    // Get the inserted topic
    const result: any = await query(`SELECT * FROM chu_de WHERE ten = ? ORDER BY ngay_tao DESC LIMIT 1`, [ten]);
    return result[0];
  }

  static async updateTopic(id: string, data: any) {
    const fields = [];
    const values = [];
    
    if (data.ten) {
      fields.push('ten = ?');
      values.push(data.ten);
    }
    if (data.mo_ta !== undefined) {
      fields.push('mo_ta = ?');
      values.push(data.mo_ta);
    }
    if (data.hinh_anh !== undefined) {
      fields.push('hinh_anh = ?');
      values.push(data.hinh_anh);
    }
    if (data.trang_thai) {
      fields.push('trang_thai = ?');
      values.push(data.trang_thai);
    }
    if (data.thu_tu_hien_thi !== undefined) {
      fields.push('thu_tu_hien_thi = ?');
      values.push(data.thu_tu_hien_thi);
    }
    
    if (fields.length === 0) {
      return await this.getTopicById(id);
    }
    
    values.push(id);
    const sql = `UPDATE chu_de SET ${fields.join(', ')} WHERE id = ?`;
    await query(sql, values);
    
    return await this.getTopicById(id);
  }

  static async deleteTopic(id: string) {
    await query(`DELETE FROM chu_de WHERE id = ?`, [id]);
    return { success: true };
  }
}
