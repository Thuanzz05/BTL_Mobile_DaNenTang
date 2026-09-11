import { query } from '../config/database';

export class FavoriteService {
  /**
   * Lấy danh sách từ yêu thích của user
   */
  static async getAll(userId: string) {
    return await query(
      `SELECT y.id as yeu_thich_id, y.ngay_tao as ngay_them_yeu_thich,
              t.*, c.ten as chu_de_ten
       FROM yeu_thich y
       INNER JOIN tu_vung t ON y.tu_vung_id = t.id
       LEFT JOIN chu_de c ON t.chu_de_id = c.id
       WHERE y.nguoi_dung_id = ?
       ORDER BY y.ngay_tao DESC`,
      [userId]
    );
  }

  /**
   * Thêm/bỏ yêu thích (toggle)
   */
  static async toggle(userId: string, wordId: string) {
    // Kiểm tra từ có tồn tại không
    const words: any[] = await query(
      'SELECT id FROM tu_vung WHERE id = ?',
      [wordId]
    );
    if (words.length === 0) {
      throw new Error('Từ vựng không tồn tại');
    }

    // Kiểm tra đã yêu thích chưa
    const existing: any[] = await query(
      'SELECT id FROM yeu_thich WHERE nguoi_dung_id = ? AND tu_vung_id = ?',
      [userId, wordId]
    );

    if (existing.length > 0) {
      // Bỏ yêu thích
      await query(
        'DELETE FROM yeu_thich WHERE nguoi_dung_id = ? AND tu_vung_id = ?',
        [userId, wordId]
      );
      return { added: false, message: 'Đã bỏ khỏi danh sách yêu thích' };
    } else {
      // Thêm yêu thích
      await query(
        `INSERT INTO yeu_thich (nguoi_dung_id, tu_vung_id) VALUES (?, ?)`,
        [userId, wordId]
      );
      return { added: true, message: 'Đã thêm vào danh sách yêu thích' };
    }
  }

  /**
   * Xóa yêu thích theo wordId
   */
  static async remove(userId: string, wordId: string) {
    const result: any = await query(
      'DELETE FROM yeu_thich WHERE nguoi_dung_id = ? AND tu_vung_id = ?',
      [userId, wordId]
    );

    if (result.affectedRows === 0) {
      throw new Error('Từ vựng không có trong danh sách yêu thích');
    }

    return { success: true };
  }

  /**
   * Kiểm tra một từ đã yêu thích chưa
   */
  static async isLiked(userId: string, wordId: string): Promise<boolean> {
    const result: any[] = await query(
      'SELECT id FROM yeu_thich WHERE nguoi_dung_id = ? AND tu_vung_id = ?',
      [userId, wordId]
    );
    return result.length > 0;
  }
}
