import type { RowDataPacket } from 'mysql2/promise';
import { query, transaction } from '../config/database';
import { StatisticsService } from './statistics.service';

interface AchievementRow extends RowDataPacket {
  id: string;
  tieu_de: string;
  mo_ta: string;
  bieu_tuong: string;
  diem_thuong: number;
  loai: 'completed_sessions' | 'streak' | 'learned_words' | null;
  moc: number | null;
  ngay_mo_khoa: Date | null;
  trang_thai: 'active' | 'inactive';
}

export class AchievementService {
  static async getForUser(userId: string) {
    const [counts, streak] = await Promise.all([
      query<any[]>(
        `SELECT
          (SELECT COUNT(*) FROM phien_hoc_tap
            WHERE nguoi_dung_id = ? AND trang_thai = 'hoan-thanh') AS completed_sessions,
          (SELECT COUNT(*) FROM tien_do_tu_vung
            WHERE nguoi_dung_id = ? AND da_hoc = TRUE) AS learned_words`,
        [userId, userId]
      ),
      StatisticsService.getLearningStreak(userId),
    ]);
    const values = {
      completed_sessions: Number(counts[0]?.completed_sessions || 0),
      streak: streak.streak,
      learned_words: Number(counts[0]?.learned_words || 0),
    };

    const rows = await this.unlockAndRead(userId, values);
    const danhSach = rows.map((achievement) => {
      const target = Number(achievement.moc || 0);
      const current = achievement.loai ? values[achievement.loai] : 0;
      return {
        id: achievement.id,
        tieu_de: achievement.tieu_de,
        mo_ta: achievement.mo_ta,
        bieu_tuong: achievement.bieu_tuong,
        diem_thuong: Number(achievement.diem_thuong),
        trang_thai: achievement.trang_thai,
        da_mo_khoa: Boolean(achievement.ngay_mo_khoa),
        ngay_mo_khoa: achievement.ngay_mo_khoa,
        tien_do: target ? Math.min(current, target) : 0,
        muc_tieu: target,
      };
    });
    const unlocked = danhSach.filter((achievement) => achievement.da_mo_khoa);

    return {
      tong_so: danhSach.length,
      da_mo_khoa: unlocked.length,
      tong_diem: unlocked.reduce((total, achievement) => total + achievement.diem_thuong, 0),
      danh_sach: danhSach,
    };
  }

  private static async unlockAndRead(
    userId: string,
    values: Record<'completed_sessions' | 'learned_words' | 'streak', number>
  ) {
    return transaction(async (connection) => {
      // Cùng khóa với thao tác sửa/xóa để không cấp huy hiệu theo điều kiện đã cũ.
      const [achievements] = await connection.query<AchievementRow[]>(
        'SELECT * FROM thanh_tich ORDER BY id FOR UPDATE'
      );
      const [earned] = await connection.query<RowDataPacket[]>(
        'SELECT thanh_tich_id FROM thanh_tich_nguoi_dung WHERE nguoi_dung_id = ?',
        [userId]
      );
      const earnedIds = new Set(earned.map((row) => row.thanh_tich_id));
      for (const achievement of achievements) {
        if (
          achievement.trang_thai === 'active' &&
          !earnedIds.has(achievement.id) &&
          achievement.loai &&
          achievement.moc &&
          values[achievement.loai] >= achievement.moc
        ) {
          await connection.query(
            'INSERT INTO thanh_tich_nguoi_dung (nguoi_dung_id, thanh_tich_id) VALUES (?, ?)',
            [userId, achievement.id]
          );
        }
      }
      const [rows] = await connection.query<AchievementRow[]>(
        `SELECT t.*, u.ngay_mo_khoa
         FROM thanh_tich t LEFT JOIN thanh_tich_nguoi_dung u
           ON u.thanh_tich_id = t.id AND u.nguoi_dung_id = ?
         WHERE t.trang_thai = 'active' OR u.nguoi_dung_id IS NOT NULL
         ORDER BY t.diem_thuong, t.ngay_tao, t.id`,
        [userId]
      );
      return rows;
    });
  }
}
