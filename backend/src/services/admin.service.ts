import { AppError } from '../utils/app-error';
import { query, transaction } from '../config/database';
import { learningPeriodStarts } from '../utils/calendar.util';
import { fillDays } from './admin-report.service';

export class AdminService {
  /**
   * Lấy thống kê dashboard admin
   */
  static async getDashboard() {
    const today = learningPeriodStarts().today;
    const start = new Date(today.getTime() - 6 * 86400000);
    const end = new Date(today.getTime() + 86400000);
    const [usersResult, topicsResult, wordsResult, sessionsResult, activeSessionsResult]: any[] =
      await Promise.all([
        query<any[]>(`SELECT COUNT(*) as count FROM nguoi_dung WHERE vai_tro = 'user'`),
        query<any[]>(`SELECT COUNT(*) as count FROM chu_de`),
        query<any[]>(`SELECT COUNT(*) as count FROM tu_vung`),
        query<any[]>(`SELECT COUNT(*) as count FROM phien_hoc_tap`),
        query<any[]>(`SELECT COUNT(*) as count FROM phien_hoc_tap WHERE trang_thai = 'dang-hoc'`),
      ]);

    // Người dùng mới 7 ngày gần nhất
    const newUsers7Days: any[] = await query(
      `SELECT DATE_FORMAT(DATE_ADD(ngay_tao, INTERVAL 7 HOUR), '%Y-%m-%d') as ngay, COUNT(*) as so_luong
       FROM nguoi_dung
       WHERE ngay_tao >= ? AND ngay_tao < ? AND vai_tro = 'user'
       GROUP BY ngay
       ORDER BY ngay ASC`,
      [start, end]
    );

    // Lượt học 7 ngày gần nhất
    const sessions7Days: any[] = await query(
      `SELECT DATE_FORMAT(DATE_ADD(bat_dau_luc, INTERVAL 7 HOUR), '%Y-%m-%d') as ngay, COUNT(*) as so_luong
       FROM phien_hoc_tap
       WHERE bat_dau_luc >= ? AND bat_dau_luc < ?
       GROUP BY ngay
       ORDER BY ngay ASC`,
      [start, end]
    );

    return {
      tong_nguoi_dung: usersResult[0]?.count || 0,
      tong_chu_de: topicsResult[0]?.count || 0,
      tong_tu_vung: wordsResult[0]?.count || 0,
      tong_luot_hoc: sessionsResult[0]?.count || 0,
      phien_dang_hoc: activeSessionsResult[0]?.count || 0,
      nguoi_dung_moi_7_ngay: fillDays(start, end, newUsers7Days, { so_luong: 0 }),
      luot_hoc_7_ngay: fillDays(start, end, sessions7Days, { so_luong: 0 }),
    };
  }

  /**
   * Lấy danh sách người dùng (có search, filter, pagination)
   */
  static async getUsers(options: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 20, 100);
    const offset = (page - 1) * limit;

    let where = `vai_tro = 'user'`;
    const params: any[] = [];

    if (options.search) {
      where += ` AND (ho_ten LIKE ? OR email LIKE ?)`;
      params.push(`%${options.search}%`, `%${options.search}%`);
    }

    if (options.status) {
      where += ` AND trang_thai = ?`;
      params.push(options.status);
    }

    const countResult: any[] = await query(
      `SELECT COUNT(*) as total FROM nguoi_dung WHERE ${where}`,
      params
    );
    const total = countResult[0]?.total || 0;

    const users: any[] = await query(
      `SELECT 
         id, ho_ten, email, anh_dai_dien, phuong_thuc_dang_nhap,
         trang_thai, ngay_tao,
         (SELECT COUNT(*) FROM phien_hoc_tap WHERE nguoi_dung_id = nguoi_dung.id) as so_phien_hoc
       FROM nguoi_dung
       WHERE ${where}
       ORDER BY ngay_tao DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      items: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Cập nhật trạng thái người dùng (khóa/mở khóa)
   */
  static async updateUserStatus(userId: string, trang_thai: string) {
    if (!['active', 'locked', 'inactive'].includes(trang_thai)) {
      throw new AppError('Trạng thái không hợp lệ');
    }
    return transaction(async (connection) => {
      const [users]: any = await connection.execute(
        'SELECT vai_tro, trang_thai FROM nguoi_dung WHERE id = ? FOR UPDATE',
        [userId]
      );
      if (!users.length) {
        throw new AppError('Không tìm thấy người dùng', 404, 'USER_NOT_FOUND');
      }
      if (users[0].vai_tro === 'admin') {
        throw new AppError('Không thể thay đổi trạng thái tài khoản admin', 403, 'ADMIN_PROTECTED');
      }
      if (users[0].trang_thai !== trang_thai) {
        await connection.execute(
          'UPDATE nguoi_dung SET trang_thai = ?, token_version = token_version + 1 WHERE id = ?',
          [trang_thai, userId]
        );
        await connection.execute(
          'UPDATE token_lam_moi SET da_thu_hoi = TRUE WHERE nguoi_dung_id = ?',
          [userId]
        );
      }
      const [updated]: any = await connection.execute(
        'SELECT id, ho_ten, email, trang_thai FROM nguoi_dung WHERE id = ?',
        [userId]
      );
      return updated[0];
    });
  }

  /**
   * Lấy thống kê chi tiết (admin statistics)
   */
  static async getStatistics() {
    const today = learningPeriodStarts().today;
    const start = new Date(today.getTime() - 6 * 86400000);
    const end = new Date(today.getTime() + 86400000);
    // Chủ đề được học nhiều nhất
    const topTopics: any[] = await query(
      `SELECT c.id, c.ten, COUNT(p.id) as luot_hoc
       FROM chu_de c
       LEFT JOIN phien_hoc_tap p ON c.id = p.chu_de_id
       GROUP BY c.id, c.ten
       ORDER BY luot_hoc DESC
       LIMIT 10`
    );

    // Từ được học nhiều nhất
    const topWords: any[] = await query(
      `SELECT t.id, t.tu_tieng_anh, t.nghia_tieng_viet, COUNT(k.id) as luot_hoc
       FROM tu_vung t
       LEFT JOIN ket_qua_hoc k ON t.id = k.tu_vung_id
       GROUP BY t.id, t.tu_tieng_anh, t.nghia_tieng_viet
       ORDER BY luot_hoc DESC
       LIMIT 10`
    );

    // Hoạt động học 7 ngày gần nhất
    const activity7Days: any[] = await query(
      `SELECT DATE_FORMAT(DATE_ADD(p.bat_dau_luc, INTERVAL 7 HOUR), '%Y-%m-%d') as ngay,
         COUNT(*) as so_phien, COALESCE(SUM(k.so_tu), 0) as so_tu
       FROM phien_hoc_tap p
       LEFT JOIN (SELECT phien_hoc_tap_id, COUNT(*) as so_tu FROM ket_qua_hoc GROUP BY phien_hoc_tap_id) k
         ON k.phien_hoc_tap_id = p.id
       WHERE p.bat_dau_luc >= ? AND p.bat_dau_luc < ?
       GROUP BY ngay
       ORDER BY ngay ASC`,
      [start, end]
    );

    return {
      chu_de_pho_bien: topTopics,
      tu_pho_bien: topWords,
      hoat_dong_7_ngay: fillDays(start, end, activity7Days, { so_phien: 0, so_tu: 0 }),
    };
  }
}
