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
      const progress = await ProgressService.getSummary(userId);

      return ResponseUtil.success(res, progress, 'Lấy tiến độ học tập thành công');
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Lấy tiến độ học theo chủ đề
   * GET /api/progress/topics
   */
  static async getProgressByTopic(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const topicId = req.query.topicId as string;
      const progress = await ProgressService.getProgressByTopic(userId, topicId);

      return ResponseUtil.success(res, progress, 'Lấy tiến độ theo chủ đề thành công');
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Lấy danh sách từ đến hạn ôn tập
   * GET /api/progress/review
   */
  static async getWordsToReview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const limit = Math.min(Number(req.query.limit || 20), 50);
      const review = await ProgressService.getWordsToReview(userId, limit);

      return ResponseUtil.success(res, review, 'Lấy từ cần ôn tập thành công');
    } catch (error) {
      return next(error);
    }
  }
}
