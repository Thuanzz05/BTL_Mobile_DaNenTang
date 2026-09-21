import type { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { query, transaction } from '../config/database';
import { AppError } from '../utils/app-error';
import { UuidUtil } from '../utils/uuid.util';
import type { AchievementInput } from '../validations/achievement.schemas';

interface AchievementRow extends RowDataPacket {
  id: string;
  loai: string | null;
  moc: number | null;
  diem_thuong: number;
}

interface ListOptions {
  search?: string;
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
}

const selection = `SELECT t.*,
  (SELECT COUNT(*) FROM thanh_tich_nguoi_dung u WHERE u.thanh_tich_id = t.id) AS so_nguoi_dat
  FROM thanh_tich t`;

async function lockAchievement(connection: PoolConnection, id: string) {
  const [rows] = await connection.query<AchievementRow[]>(
    'SELECT * FROM thanh_tich WHERE id = ? FOR UPDATE',
    [id]
  );
  if (!rows.length) {
    throw new AppError('Không tìm thấy thành tích', 404, 'ACHIEVEMENT_NOT_FOUND');
  }
  return rows[0];
}

async function hasRecipients(connection: PoolConnection, id: string) {
  const [rows] = await connection.query<RowDataPacket[]>(
    'SELECT nguoi_dung_id FROM thanh_tich_nguoi_dung WHERE thanh_tich_id = ? LIMIT 1 FOR UPDATE',
    [id]
  );
  return rows.length > 0;
}

export class AdminAchievementService {
  static async list(options: ListOptions) {
    const page = options.page || 1;
    const limit = options.limit || 15;
    const conditions = ['1 = 1'];
    const params: (string | number)[] = [];
    if (options.search) {
      conditions.push('t.tieu_de LIKE ?');
      params.push(`%${options.search}%`);
    }
    if (options.type) {
      conditions.push('t.loai = ?');
      params.push(options.type);
    }
    if (options.status) {
      conditions.push('t.trang_thai = ?');
      params.push(options.status);
    }
    const where = ' WHERE ' + conditions.join(' AND ');
    const [count] = await query<{ total: number }[]>(
      'SELECT COUNT(*) AS total FROM thanh_tich t' + where,
      params
    );
    const items = await query(
      selection + where + ' ORDER BY t.ngay_tao DESC, t.id LIMIT ? OFFSET ?',
      [...params, limit, (page - 1) * limit]
    );
    return { items, page, limit, total: Number(count.total) };
  }

  static async create(data: AchievementInput) {
    const id = UuidUtil.generate();
    await query('INSERT INTO thanh_tich SET ?', [
      { ...data, id, trang_thai: data.trang_thai || 'active' },
    ]);
    const [created] = await query<RowDataPacket[]>(selection + ' WHERE t.id = ?', [id]);
    return created;
  }

  static async update(id: string, data: Partial<AchievementInput>) {
    return transaction(async (connection) => {
      const current = await lockAchievement(connection, id);
      const changesRule = ['loai', 'moc', 'diem_thuong'].some(
        (field) =>
          data[field as keyof AchievementInput] !== undefined &&
          data[field as keyof AchievementInput] !== current[field]
      );
      if (changesRule && (await hasRecipients(connection, id))) {
        throw new AppError(
          'Thành tích đã có người nhận. Hãy tạo thành tích mới để thay đổi điều kiện hoặc điểm thưởng.',
          409,
          'ACHIEVEMENT_RULE_LOCKED'
        );
      }
      await connection.query('UPDATE thanh_tich SET ? WHERE id = ?', [data, id]);
      const [[updated]] = await connection.query<RowDataPacket[]>(selection + ' WHERE t.id = ?', [
        id,
      ]);
      return updated;
    });
  }

  static async remove(id: string) {
    return transaction(async (connection) => {
      await lockAchievement(connection, id);
      if (await hasRecipients(connection, id)) {
        throw new AppError(
          'Không thể xóa thành tích đã có người nhận. Bạn có thể tắt cấp mới.',
          409,
          'ACHIEVEMENT_IN_USE'
        );
      }
      await connection.query('DELETE FROM thanh_tich WHERE id = ?', [id]);
      return { id };
    });
  }

  static async recipients(id: string, options: ListOptions) {
    const [achievement] = await query<RowDataPacket[]>(selection + ' WHERE t.id = ?', [id]);
    if (!achievement) {
      throw new AppError('Không tìm thấy thành tích', 404, 'ACHIEVEMENT_NOT_FOUND');
    }
    const page = options.page || 1;
    const limit = options.limit || 15;
    const params: (string | number)[] = [id];
    let where = ' WHERE u.thanh_tich_id = ?';
    if (options.search) {
      where += ' AND (n.ho_ten LIKE ? OR n.email LIKE ?)';
      params.push(`%${options.search}%`, `%${options.search}%`);
    }
    const join = ' FROM thanh_tich_nguoi_dung u JOIN nguoi_dung n ON n.id = u.nguoi_dung_id';
    const [count] = await query<{ total: number }[]>(
      'SELECT COUNT(*) AS total' + join + where,
      params
    );
    const items = await query(
      'SELECT n.id, n.ho_ten, n.email, u.ngay_mo_khoa' +
        join +
        where +
        ' ORDER BY u.ngay_mo_khoa DESC, n.id LIMIT ? OFFSET ?',
      [...params, limit, (page - 1) * limit]
    );
    return {
      achievement,
      items,
      pagination: {
        page,
        limit,
        total: Number(count.total),
        totalPages: Math.ceil(count.total / limit),
      },
    };
  }
}
