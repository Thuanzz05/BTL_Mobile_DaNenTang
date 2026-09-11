import { query } from '../config/database';

export class AdminService {
  /**
   * Lấy thống kê dashboard admin
   */
  static async getDashboard() {
    const [
      usersResult,
      topicsResult,
      wordsResult,
      sessionsResult,
      activeSessionsResult,
    ]: any[] = await Promise.all([
      query<any[]>(`SELECT COUNT(*) as count FROM nguoi_dung WHERE vai_tro = 'user'`),
      query<any[]>(`SELECT COUNT(*) as count FROM chu_de`),
      query<any[]>(`SELECT COUNT(*) as count FROM tu_vung`),
      query<any[]>(`SELECT COUNT(*) as count FROM phien_hoc_tap`),
      query<any[]>(`SELECT COUNT(*) as count FROM phien_hoc_tap WHERE trang_thai = 'dang-hoc'`),
    ]);

    // Người dùng mới 7 ngày gần nhất
    const newUsers7Days: any[] = await query(
      `SELECT DATE(ngay_tao) as ngay, COUNT(*) as so_luong
       FROM nguoi_dung
       WHERE ngay_tao >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND vai_tro = 'user'
       GROUP BY DATE(ngay_tao)
       ORDER BY ngay ASC`
    );

    // Lượt học 7 ngày gần nhất
    const sessions7Days: any[] = await query(
      `SELECT DATE(bat_dau_luc) as ngay, COUNT(*) as so_luong
       FROM phien_hoc_tap
       WHERE bat_dau_luc >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(bat_dau_luc)
       ORDER BY ngay ASC`
    );

    return {
      tong_nguoi_dung: usersResult[0]?.count || 0,
      tong_chu_de: topicsResult[0]?.count || 0,
      tong_tu_vung: wordsResult[0]?.count || 0,
      tong_luot_hoc: sessionsResult[0]?.count || 0,
      phien_dang_hoc: activeSessionsResult[0]?.count || 0,
      nguoi_dung_moi_7_ngay: newUsers7Days,
      luot_hoc_7_ngay: sessions7Days,
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
    const validStatuses = ['active', 'locked', 'inactive'];
    if (!validStatuses.includes(trang_thai)) {
      throw new Error(`Trạng thái không hợp lệ. Phải là: ${validStatuses.join(', ')}`);
    }

    // Không cho phép khóa admin
    const users: any[] = await query(
      `SELECT vai_tro FROM nguoi_dung WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) throw new Error('Không tìm thấy người dùng');
    if (users[0].vai_tro === 'admin') throw new Error('Không thể thay đổi trạng thái tài khoản admin');

    await query(
      `UPDATE nguoi_dung SET trang_thai = ? WHERE id = ?`,
      [trang_thai, userId]
    );

    const updated: any[] = await query(
      `SELECT id, ho_ten, email, trang_thai FROM nguoi_dung WHERE id = ?`,
      [userId]
    );

    return updated[0];
  }

  /**
   * Lấy thống kê chi tiết (admin statistics)
   */
  static async getStatistics() {
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
      `SELECT DATE(bat_dau_luc) as ngay, COUNT(*) as so_phien, SUM(tong_so_tu) as so_tu
       FROM phien_hoc_tap
       WHERE bat_dau_luc >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(bat_dau_luc)
       ORDER BY ngay ASC`
    );

    return {
      chu_de_pho_bien: topTopics,
      tu_pho_bien: topWords,
      hoat_dong_7_ngay: activity7Days,
    };
  }
}
