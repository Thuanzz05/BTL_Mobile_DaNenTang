import { query, transaction } from '../config/database';
import { UuidUtil } from '../utils/uuid.util';
import { AppError } from '../utils/app-error';

export class TopicService {
  static async getAllTopics(status?: string, includeInactiveWords = false) {
    let sql = `
      SELECT t.*, 
        (SELECT COUNT(*) FROM tu_vung WHERE chu_de_id = t.id
          ${includeInactiveWords ? '' : "AND trang_thai = 'active'"}) AS word_count,
        (SELECT COUNT(*) FROM tu_vung WHERE chu_de_id = t.id AND trang_thai = 'active') AS active_word_count
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

  static async getTopicById(id: string, includeInactiveWords = false) {
    const sql = `
      SELECT t.*,
        (SELECT COUNT(*) FROM tu_vung WHERE chu_de_id = t.id
          ${includeInactiveWords ? '' : "AND trang_thai = 'active'"}) AS word_count,
        (SELECT COUNT(*) FROM tu_vung WHERE chu_de_id = t.id AND trang_thai = 'active') AS active_word_count
      FROM chu_de t
      WHERE t.id = ?
    `;

    const results: any = await query(sql, [id]);
    return results[0] || null;
  }

  static async createTopic(data: any) {
    const { ten, mo_ta, hinh_anh, trang_thai, thu_tu_hien_thi } = data;
    const id = UuidUtil.generate();
    const sql = `
      INSERT INTO chu_de (id, ten, mo_ta, hinh_anh, trang_thai, thu_tu_hien_thi)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await query(sql, [
      id,
      ten,
      mo_ta || null,
      hinh_anh || null,
      trang_thai || 'active',
      thu_tu_hien_thi || 0,
    ]);

    // Get the inserted topic
    const result: any = await query('SELECT * FROM chu_de WHERE id = ?', [id]);
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
      return await this.getTopicById(id, true);
    }

    values.push(id);
    const sql = `UPDATE chu_de SET ${fields.join(', ')} WHERE id = ?`;
    await query(sql, values);

    return await this.getTopicById(id, true);
  }

  static async deleteTopic(id: string) {
    return transaction(async (connection) => {
      const [topics]: any = await connection.execute(
        'SELECT id FROM chu_de WHERE id = ? FOR UPDATE',
        [id]
      );
      if (!topics.length) {
        throw new AppError('Chủ đề không tồn tại', 404, 'TOPIC_NOT_FOUND');
      }
      const [words]: any = await connection.execute(
        'SELECT id FROM tu_vung WHERE chu_de_id = ? LIMIT 1 FOR UPDATE',
        [id]
      );
      const [sessions]: any = await connection.execute(
        'SELECT id FROM phien_hoc_tap WHERE chu_de_id = ? LIMIT 1 FOR UPDATE',
        [id]
      );
      if (words.length || sessions.length) {
        throw new AppError(
          'Không thể xóa chủ đề còn từ vựng hoặc lịch sử học',
          409,
          'TOPIC_IN_USE'
        );
      }
      await connection.execute('DELETE FROM chu_de WHERE id = ?', [id]);
      return { success: true };
    });
  }
}
