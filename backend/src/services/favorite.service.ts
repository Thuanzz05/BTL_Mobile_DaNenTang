import { query, transaction } from '../config/database';
import { AppError } from '../utils/app-error';
import { UuidUtil } from '../utils/uuid.util';

export class FavoriteService {
  /**
   * Lấy danh sách từ yêu thích mới nhất của người học
   */
  static async getAll(userId: string) {
    return query(
      `SELECT y.id AS yeu_thich_id, y.ngay_tao AS ngay_them_yeu_thich, t.*, c.ten AS chu_de_ten
      FROM yeu_thich y JOIN tu_vung t ON y.tu_vung_id = t.id
      JOIN chu_de c ON t.chu_de_id = c.id AND c.trang_thai = 'active'
      WHERE y.nguoi_dung_id = ? AND t.trang_thai = 'active' ORDER BY y.ngay_tao DESC, y.id`,
      [userId]
    );
  }

  /**
   * Khóa thao tác của người học để thêm/bỏ yêu thích nhất quán
   */
  private static async set(userId: string, wordId: string, desired?: boolean) {
    return transaction(async (connection) => {
      await connection.execute('SELECT id FROM nguoi_dung WHERE id = ? FOR UPDATE', [userId]);
      const [words]: any = await connection.execute(
        `SELECT t.id FROM tu_vung t JOIN chu_de c ON t.chu_de_id = c.id
         WHERE t.id = ? AND c.trang_thai = 'active' AND t.trang_thai = 'active' FOR SHARE`,
        [wordId]
      );
      if (!words.length) {
        throw new AppError('Từ vựng không tồn tại', 404, 'WORD_NOT_FOUND');
      }
      const [existing]: any = await connection.execute(
        'SELECT id FROM yeu_thich WHERE nguoi_dung_id = ? AND tu_vung_id = ?',
        [userId, wordId]
      );
      const added = desired ?? !existing.length;
      if (added && !existing.length) {
        await connection.execute(
          'INSERT INTO yeu_thich (id, nguoi_dung_id, tu_vung_id) VALUES (?, ?, ?)',
          [UuidUtil.generate(), userId, wordId]
        );
      } else if (!added) {
        await connection.execute(
          'DELETE FROM yeu_thich WHERE nguoi_dung_id = ? AND tu_vung_id = ?',
          [userId, wordId]
        );
      }
      await connection.execute(
        'UPDATE tien_do_tu_vung SET yeu_thich = ? WHERE nguoi_dung_id = ? AND tu_vung_id = ?',
        [added, userId, wordId]
      );
      return {
        added,
        message: added ? 'Đã thêm vào danh sách yêu thích' : 'Đã bỏ khỏi danh sách yêu thích',
      };
    });
  }

  /**
   * Đảo trạng thái yêu thích, giữ tương thích với API cũ
   */
  static async toggle(userId: string, wordId: string) {
    return this.set(userId, wordId);
  }
  /**
   * Thêm yêu thích; gửi lại yêu cầu không đảo trạng thái
   */
  static async add(userId: string, wordId: string) {
    return this.set(userId, wordId, true);
  }
  /**
   * Bỏ yêu thích; gọi lại vẫn trả thành công
   */
  static async remove(userId: string, wordId: string) {
    return transaction(async (connection) => {
      await connection.execute('SELECT id FROM nguoi_dung WHERE id = ? FOR UPDATE', [userId]);
      await connection.execute('DELETE FROM yeu_thich WHERE nguoi_dung_id = ? AND tu_vung_id = ?', [
        userId,
        wordId,
      ]);
      await connection.execute(
        'UPDATE tien_do_tu_vung SET yeu_thich = FALSE WHERE nguoi_dung_id = ? AND tu_vung_id = ?',
        [userId, wordId]
      );
      return { success: true };
    });
  }
  /**
   * Kiểm tra trạng thái yêu thích của một từ
   */
  static async isLiked(userId: string, wordId: string) {
    const rows = await query<any[]>(
      'SELECT id FROM yeu_thich WHERE nguoi_dung_id = ? AND tu_vung_id = ?',
      [userId, wordId]
    );

    return rows.length > 0;
  }
}
