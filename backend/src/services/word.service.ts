import { query } from '../config/database';
import { UuidUtil } from '../utils/uuid.util';

export class WordService {
  /**
   * Lấy danh sách từ vựng theo chủ đề
   */
  static async getByTopic(topicId: string, userId?: string) {
    const sql = `
      SELECT 
        t.*,
        ${userId ? `
        CASE WHEN y.id IS NOT NULL THEN TRUE ELSE FALSE END as da_yeu_thich
        ` : 'FALSE as da_yeu_thich'}
      FROM tu_vung t
      ${userId ? `
      LEFT JOIN yeu_thich y ON t.id = y.tu_vung_id AND y.nguoi_dung_id = ?
      ` : ''}
      WHERE t.chu_de_id = ?
      ORDER BY t.thu_tu_hien_thi ASC
    `;

    const params: any[] = [];
    if (userId) params.push(userId);
    params.push(topicId);

    return await query(sql, params);
  }

  /**
   * Lấy chi tiết từ vựng kèm ví dụ
   */
  static async getById(id: string, userId?: string) {
    const wordSql = `
      SELECT 
        t.*,
        ${userId ? `
        CASE WHEN y.id IS NOT NULL THEN TRUE ELSE FALSE END as da_yeu_thich
        ` : 'FALSE as da_yeu_thich'}
      FROM tu_vung t
      ${userId ? `
      LEFT JOIN yeu_thich y ON t.id = y.tu_vung_id AND y.nguoi_dung_id = ?
      ` : ''}
      WHERE t.id = ?
    `;

    const wordParams: any[] = [];
    if (userId) wordParams.push(userId);
    wordParams.push(id);

    const words: any[] = await query(wordSql, wordParams);

    if (words.length === 0) {
      throw new Error('Từ vựng không tồn tại');
    }

    // Lấy ví dụ
    const examples: any[] = await query(
      'SELECT * FROM vi_du WHERE tu_vung_id = ? ORDER BY thu_tu_hien_thi ASC',
      [id]
    );

    return { ...words[0], vi_du: examples };
  }

  /**
   * Tạo từ vựng mới (admin)
   */
  static async create(data: {
    chu_de_id: string;
    tu_tieng_anh: string;
    phien_am?: string;
    loai_tu: string;
    nghia_tieng_viet: string;
    url_am_thanh?: string;
    url_hinh_anh?: string;
    thu_tu_hien_thi?: number;
    vi_du?: Array<{ cau_tieng_anh: string; cau_tieng_viet: string; thu_tu_hien_thi?: number }>;
  }) {
    const id = UuidUtil.generate();

    await query(
      `INSERT INTO tu_vung 
        (id, chu_de_id, tu_tieng_anh, phien_am, loai_tu, nghia_tieng_viet, url_am_thanh, url_hinh_anh, thu_tu_hien_thi)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.chu_de_id,
        data.tu_tieng_anh,
        data.phien_am || null,
        data.loai_tu,
        data.nghia_tieng_viet,
        data.url_am_thanh || null,
        data.url_hinh_anh || null,
        data.thu_tu_hien_thi || 0,
      ]
    );

    // Tạo ví dụ nếu có
    if (data.vi_du && data.vi_du.length > 0) {
      for (let i = 0; i < data.vi_du.length; i++) {
        const ex = data.vi_du[i];
        await query(
          `INSERT INTO vi_du (id, tu_vung_id, cau_tieng_anh, cau_tieng_viet, thu_tu_hien_thi)
           VALUES (UUID(), ?, ?, ?, ?)`,
          [id, ex.cau_tieng_anh, ex.cau_tieng_viet, ex.thu_tu_hien_thi ?? i]
        );
      }
    }

    return await this.getById(id);
  }

  /**
   * Cập nhật từ vựng (admin)
   */
  static async update(id: string, data: Partial<{
    tu_tieng_anh: string;
    phien_am: string;
    loai_tu: string;
    nghia_tieng_viet: string;
    url_am_thanh: string;
    url_hinh_anh: string;
    thu_tu_hien_thi: number;
    chu_de_id: string;
  }>) {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.tu_tieng_anh !== undefined) { fields.push('tu_tieng_anh = ?'); values.push(data.tu_tieng_anh); }
    if (data.phien_am !== undefined) { fields.push('phien_am = ?'); values.push(data.phien_am); }
    if (data.loai_tu !== undefined) { fields.push('loai_tu = ?'); values.push(data.loai_tu); }
    if (data.nghia_tieng_viet !== undefined) { fields.push('nghia_tieng_viet = ?'); values.push(data.nghia_tieng_viet); }
    if (data.url_am_thanh !== undefined) { fields.push('url_am_thanh = ?'); values.push(data.url_am_thanh); }
    if (data.url_hinh_anh !== undefined) { fields.push('url_hinh_anh = ?'); values.push(data.url_hinh_anh); }
    if (data.thu_tu_hien_thi !== undefined) { fields.push('thu_tu_hien_thi = ?'); values.push(data.thu_tu_hien_thi); }
    if (data.chu_de_id !== undefined) { fields.push('chu_de_id = ?'); values.push(data.chu_de_id); }

    if (fields.length === 0) {
      return await this.getById(id);
    }

    values.push(id);
    await query(`UPDATE tu_vung SET ${fields.join(', ')} WHERE id = ?`, values);
    return await this.getById(id);
  }

  /**
   * Xóa từ vựng (admin) - kiểm tra không trong phiên học đang diễn ra
   */
  static async delete(id: string) {
    // Kiểm tra từ đang trong phiên học active không
    const activeCheck: any[] = await query(
      `SELECT k.id FROM ket_qua_hoc k
       INNER JOIN phien_hoc_tap p ON k.phien_hoc_tap_id = p.id
       WHERE k.tu_vung_id = ? AND p.trang_thai = 'dang-hoc'
       LIMIT 1`,
      [id]
    );

    if (activeCheck.length > 0) {
      throw new Error('Không thể xóa từ vựng đang trong phiên học');
    }

    // Xóa ví dụ trước
    await query('DELETE FROM vi_du WHERE tu_vung_id = ?', [id]);
    // Xóa tiến độ
    await query('DELETE FROM tien_do_tu_vung WHERE tu_vung_id = ?', [id]);
    // Xóa yêu thích
    await query('DELETE FROM yeu_thich WHERE tu_vung_id = ?', [id]);
    // Xóa từ
    await query('DELETE FROM tu_vung WHERE id = ?', [id]);

    return { success: true };
  }

  /**
   * Lấy tất cả từ (admin) có filter, search, pagination
   */
  static async getAll(options: {
    topicId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 20, 100);
    const offset = (page - 1) * limit;

    let where = '1=1';
    const params: any[] = [];

    if (options.topicId) {
      where += ' AND t.chu_de_id = ?';
      params.push(options.topicId);
    }

    if (options.search) {
      where += ' AND (t.tu_tieng_anh LIKE ? OR t.nghia_tieng_viet LIKE ?)';
      params.push(`%${options.search}%`, `%${options.search}%`);
    }

    const countResult: any[] = await query(
      `SELECT COUNT(*) as total FROM tu_vung t WHERE ${where}`,
      params
    );
    const total = countResult[0]?.total || 0;

    const words: any[] = await query(
      `SELECT t.*, c.ten as chu_de_ten
       FROM tu_vung t
       LEFT JOIN chu_de c ON t.chu_de_id = c.id
       WHERE ${where}
       ORDER BY t.thu_tu_hien_thi ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      items: words,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
