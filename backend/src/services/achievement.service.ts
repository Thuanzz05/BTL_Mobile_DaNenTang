import { query } from '../config/database';
import { StatisticsService } from './statistics.service';

interface AchievementRow {
  id: string;
  tieu_de: string;
  mo_ta: string;
  bieu_tuong: string;
  diem_thuong: number;
  loai: 'completed_sessions' | 'streak' | 'learned_words' | null;
  moc: number | null;
  ngay_mo_khoa: Date | null;
}

export class AchievementService {
  static async getForUser(userId: string) {
    const [achievements, counts, streak] = await Promise.all([
      this.getRows(userId),
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

    const unlockable = achievements.filter(
      (achievement) =>
        !achievement.ngay_mo_khoa &&
        achievement.loai &&
        achievement.moc &&
        values[achievement.loai] >= achievement.moc
    );
    await Promise.all(
      unlockable.map((achievement) =>
        query(
          'INSERT IGNORE INTO thanh_tich_nguoi_dung (nguoi_dung_id, thanh_tich_id) VALUES (?, ?)',
          [userId, achievement.id]
        )
      )
    );

    const rows = unlockable.length ? await this.getRows(userId) : achievements;
    const danhSach = rows.map((achievement) => {
      const target = Number(achievement.moc || 0);
      const current = achievement.loai ? values[achievement.loai] : 0;
      return {
        id: achievement.id,
        tieu_de: achievement.tieu_de,
        mo_ta: achievement.mo_ta,
        bieu_tuong: achievement.bieu_tuong,
        diem_thuong: Number(achievement.diem_thuong),
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

  private static getRows(userId: string) {
    return query<AchievementRow[]>(
      `SELECT t.id, t.tieu_de, t.mo_ta, t.bieu_tuong, t.diem_thuong,
        t.loai, t.moc, u.ngay_mo_khoa
      FROM thanh_tich t
      LEFT JOIN thanh_tich_nguoi_dung u
        ON u.thanh_tich_id = t.id AND u.nguoi_dung_id = ?
      ORDER BY t.diem_thuong, t.ngay_tao, t.id`,
      [userId]
    );
  }
}
