import { query } from '../config/database';
import { AuthService } from './auth.service';
import { LearningService } from './learning.service';
import { ProgressService } from './progress.service';

export class HomeService {
  /**
   * Tổng hợp hồ sơ, tiến độ hôm nay, chủ đề phổ biến và số từ đến hạn ôn
   */
  static async getDashboard(userId: string) {
    const popularTopicsSql = `
      SELECT
        c.*,
        (SELECT COUNT(*) FROM tu_vung t WHERE t.chu_de_id = c.id AND t.trang_thai = 'active') AS so_luong_tu,
        (
          SELECT COUNT(*)
          FROM phien_hoc_tap s
          WHERE s.chu_de_id = c.id
            AND s.trang_thai = 'hoan-thanh'
        ) AS luot_hoc
      FROM chu_de c
      WHERE c.trang_thai = 'active'
      ORDER BY luot_hoc DESC, c.thu_tu_hien_thi, c.id
      LIMIT 4
    `;

    const [user, progress, review, topics] = await Promise.all([
      AuthService.getMe(userId),
      ProgressService.getSummary(userId),
      LearningService.getReviewWords(userId, 1),
      query(popularTopicsSql),
    ]);

    return {
      nguoi_dung: user,
      tien_do_hom_nay: {
        da_hoc: progress.hom_nay,
        muc_tieu: user?.muc_tieu_hang_ngay ?? 20,
      },
      chu_de_pho_bien: topics,
      so_tu_can_on: review.so_tu_can_on,
      tien_do: progress,
    };
  }
}
