import { query, transaction } from '../config/database';
import { wordSchema, wordStatusSchema } from '../validations/request.schemas';
import { AppError } from '../utils/app-error';
import { UuidUtil } from '../utils/uuid.util';

export class WordService {
  /**
   * Lấy từ vựng của chủ đề đang hiển thị, kèm trạng thái yêu thích
   */
  static async getByTopic(topicId: string, userId?: string) {
    return query(
      `SELECT t.*, (y.id IS NOT NULL) AS da_yeu_thich
      FROM tu_vung t JOIN chu_de c ON t.chu_de_id = c.id AND c.trang_thai = 'active'
      LEFT JOIN yeu_thich y ON t.id = y.tu_vung_id AND y.nguoi_dung_id = ?
      WHERE t.chu_de_id = ? AND t.trang_thai = 'active' ORDER BY t.thu_tu_hien_thi, t.id`,
      [userId || null, topicId]
    );
  }

  /**
   * Lấy chi tiết từ và ví dụ; chỉ admin được xem từ hoặc chủ đề ẩn
   */
  static async getById(id: string, userId?: string, includeInactive = false) {
    const words = await query<any[]>(
      `SELECT t.*, c.ten AS chu_de_ten, (y.id IS NOT NULL) AS da_yeu_thich FROM tu_vung t
      JOIN chu_de c ON t.chu_de_id = c.id
      LEFT JOIN yeu_thich y ON t.id = y.tu_vung_id AND y.nguoi_dung_id = ?
      WHERE t.id = ? ${includeInactive ? '' : "AND c.trang_thai = 'active' AND t.trang_thai = 'active'"}`,
      [userId || null, id]
    );
    if (!words.length) {
      throw new AppError('Từ vựng không tồn tại', 404, 'WORD_NOT_FOUND');
    }
    const examples = await query(
      'SELECT * FROM vi_du WHERE tu_vung_id = ? ORDER BY thu_tu_hien_thi, id',
      [id]
    );

    return { ...words[0], vi_du: examples };
  }

  /**
   * Tạo từ vựng và ví dụ trong cùng giao dịch
   */
  static async create(input: unknown) {
    const data = wordSchema.parse(input);

    const id = UuidUtil.generate();
    await transaction(async (connection) => {
      const [topics]: any = await connection.execute(
        'SELECT id FROM chu_de WHERE id = ? FOR UPDATE',
        [data.chu_de_id]
      );
      if (!topics.length) {
        throw new AppError('Chủ đề không tồn tại', 404, 'TOPIC_NOT_FOUND');
      }
      await connection.execute(
        `INSERT INTO tu_vung (id, chu_de_id, tu_tieng_anh, phien_am, loai_tu, nghia_tieng_viet, url_am_thanh, url_hinh_anh, thu_tu_hien_thi, trang_thai)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.chu_de_id,
          data.tu_tieng_anh,
          data.phien_am ?? null,
          data.loai_tu,
          data.nghia_tieng_viet,
          data.url_am_thanh ?? null,
          data.url_hinh_anh ?? null,
          data.thu_tu_hien_thi ?? 0,
          data.trang_thai ?? 'active',
        ]
      );
      for (const [index, example] of (data.vi_du || []).entries()) {
        await connection.execute(
          'INSERT INTO vi_du (id, tu_vung_id, cau_tieng_anh, cau_tieng_viet, thu_tu_hien_thi) VALUES (?, ?, ?, ?, ?)',
          [
            UuidUtil.generate(),
            id,
            example.cau_tieng_anh,
            example.cau_tieng_viet,
            example.thu_tu_hien_thi ?? index,
          ]
        );
      }
    });

    return this.getById(id, undefined, true);
  }

  /**
   * Cập nhật từ; chỉ thay danh sách ví dụ khi client gửi vi_du
   */
  static async update(id: string, input: unknown) {
    const data = wordSchema.partial().parse(input);
    await transaction(async (connection) => {
      const [words]: any = await connection.execute(
        'SELECT id FROM tu_vung WHERE id = ? FOR UPDATE',
        [id]
      );
      if (!words.length) {
        throw new AppError('Từ vựng không tồn tại', 404, 'WORD_NOT_FOUND');
      }
      const { vi_du, ...fields } = data;
      const entries = Object.entries(fields);
      if (entries.length) {
        await connection.execute(
          'UPDATE tu_vung SET ' + entries.map(([key]) => key + ' = ?').join(', ') + ' WHERE id = ?',
          [...entries.map(([, value]) => value), id]
        );
      }
      // Omitting vi_du preserves examples; [] explicitly removes them.
      if (vi_du !== undefined) {
        await connection.execute('DELETE FROM vi_du WHERE tu_vung_id = ?', [id]);
        for (const [index, example] of vi_du.entries()) {
          await connection.execute(
            'INSERT INTO vi_du (id, tu_vung_id, cau_tieng_anh, cau_tieng_viet, thu_tu_hien_thi) VALUES (?, ?, ?, ?, ?)',
            [
              UuidUtil.generate(),
              id,
              example.cau_tieng_anh,
              example.cau_tieng_viet,
              example.thu_tu_hien_thi ?? index,
            ]
          );
        }
      }
    });

    return this.getById(id, undefined, true);
  }

  /**
   * Chặn xóa từ đã được dùng trong phiên học hoặc có tiến độ học
   */
  static async delete(id: string) {
    return transaction(async (connection) => {
      const [words]: any = await connection.execute(
        'SELECT id FROM tu_vung WHERE id = ? FOR UPDATE',
        [id]
      );
      if (!words.length) {
        throw new AppError('Từ vựng không tồn tại', 404, 'WORD_NOT_FOUND');
      }
      const [members]: any = await connection.execute(
        'SELECT tu_vung_id FROM phien_hoc_tu WHERE tu_vung_id = ? LIMIT 1 FOR UPDATE',
        [id]
      );
      const [results]: any = await connection.execute(
        'SELECT id FROM ket_qua_hoc WHERE tu_vung_id = ? LIMIT 1 FOR UPDATE',
        [id]
      );
      const [progress]: any = await connection.execute(
        'SELECT tu_vung_id FROM tien_do_tu_vung WHERE tu_vung_id = ? AND da_hoc = TRUE LIMIT 1 FOR UPDATE',
        [id]
      );
      if (members.length || results.length || progress.length) {
        throw new AppError(
          'Không thể xóa từ đã có dữ liệu học hoặc thuộc phiên học. Bạn có thể ẩn từ này',
          409,
          'WORD_IN_USE'
        );
      }
      await connection.execute('DELETE FROM tu_vung WHERE id = ?', [id]);
      return { success: true };
    });
  }

  /**
   * Tìm kiếm, lọc chủ đề và phân trang danh sách từ vựng
   */
  static async getAll(options: {
    topicId?: string;
    search?: string;
    page?: number;
    limit?: number;
    userId?: string;
    includeInactive?: boolean;
    status?: string;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const where = [
      options.includeInactive ? '1=1' : "c.trang_thai = 'active' AND t.trang_thai = 'active'",
    ];
    const params: any[] = [];
    if (options.includeInactive && options.status) {
      where.push('t.trang_thai = ?');
      params.push(wordStatusSchema.parse(options.status));
    }
    if (options.topicId) {
      where.push('t.chu_de_id = ?');
      params.push(options.topicId);
    }
    if (options.search) {
      where.push('(t.tu_tieng_anh LIKE ? OR t.nghia_tieng_viet LIKE ?)');
      params.push('%' + options.search + '%', '%' + options.search + '%');
    }
    const filter = where.join(' AND ');

    const counts = await query<any[]>(
      'SELECT COUNT(*) AS total FROM tu_vung t JOIN chu_de c ON t.chu_de_id = c.id WHERE ' + filter,
      params
    );
    const items = await query(
      `SELECT t.*, c.ten AS chu_de_ten, (y.id IS NOT NULL) AS da_yeu_thich
      FROM tu_vung t JOIN chu_de c ON t.chu_de_id = c.id
      LEFT JOIN yeu_thich y ON t.id = y.tu_vung_id AND y.nguoi_dung_id = ?
      WHERE ${filter} ORDER BY t.thu_tu_hien_thi, t.id LIMIT ? OFFSET ?`,
      [options.userId || null, ...params, limit, (page - 1) * limit]
    );
    const total = Number(counts[0].total);

    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
