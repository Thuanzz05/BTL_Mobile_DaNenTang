import { NextFunction, Request, Response } from 'express';
import { ProgressService } from '../services/progress.service';
import { ResponseUtil } from '../utils/response.util';

export class ProgressController {
  /**
   * Lấy tiến độ học tập tổng thể
   * GET /api/progress
   */
  static async getProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const [overall, byTopic] = await Promise.all([
        ProgressService.getUserProgress(userId),
        ProgressService.getProgressByTopic(userId),
      ]);

      // Tính thống kê hôm nay, tuần, tháng
      const todaySql = `
        SELECT COUNT(DISTINCT tu_vung_id) as count
        FROM tien_do_tu_vung
        WHERE nguoi_dung_id = ? AND DATE(lan_on_tap_cuoi) = CURDATE()
      `;
      const weekSql = `
        SELECT COUNT(DISTINCT tu_vung_id) as count
        FROM tien_do_tu_vung
        WHERE nguoi_dung_id = ?
          AND lan_on_tap_cuoi >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      `;
      const monthSql = `
        SELECT COUNT(DISTINCT tu_vung_id) as count
        FROM tien_do_tu_vung
        WHERE nguoi_dung_id = ?
          AND lan_on_tap_cuoi >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      `;

      const { query } = await import('../config/database');
      const [todayResult, weekResult, monthResult]: any = await Promise.all([
        query(todaySql, [userId]),
        query(weekSql, [userId]),
        query(monthSql, [userId]),
      ]);

      const total = overall.total_learned || 0;
      const da_nho = (overall.mastered || 0) + (overall.remembered || 0);
      const chua_chac = overall.uncertain || 0;
      const chua_nho = overall.forgotten || 0;
      const ty_le = total > 0 ? Math.round((da_nho / total) * 100) : 0;

      return ResponseUtil.success(res, {
        tong_so_tu_da_hoc: total,
        da_nho,
        chua_chac,
        chua_nho,
        ty_le,
        hom_nay: todayResult[0]?.count || 0,
        tuan_nay: weekResult[0]?.count || 0,
        thang_nay: monthResult[0]?.count || 0,
        theo_chu_de: byTopic,
      }, 'Lấy tiến độ học tập thành công');
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Lấy tiến độ theo chủ đề
   * GET /api/progress/topics
   */
  static async getProgressByTopic(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { topicId } = req.query;

      const result = await ProgressService.getProgressByTopic(userId, topicId as string);
      return ResponseUtil.success(res, result, 'Lấy tiến độ theo chủ đề thành công');
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Lấy từ cần ôn tập
   * GET /api/progress/review
   */
  static async getWordsToReview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const limit = req.query.limit ? Math.min(parseInt(req.query.limit as string), 50) : 20;

      const words = await ProgressService.getWordsToReview(userId, limit);
      return ResponseUtil.success(res, {
        so_tu_can_on: (words as any[]).length,
        danh_sach_tu: words,
      }, 'Lấy từ cần ôn tập thành công');
    } catch (error: any) {
      next(error);
    }
  }
}
