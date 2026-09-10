import { NextFunction, Request, Response } from 'express';
import { LearningService } from '../services/learning.service';
import { ResponseUtil } from '../utils/response.util';

export class LearningController {
  /**
   * Bắt đầu phiên học mới
   * POST /api/learning/start
   */
  static async startSession(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { chu_de_id, tong_so_tu } = req.body;

      if (!chu_de_id) {
        return ResponseUtil.error(res, 'Thiếu chu_de_id', 'MISSING_FIELDS', 400);
      }

      const wordCount = tong_so_tu ? Math.min(Math.max(parseInt(tong_so_tu), 5), 50) : 20;
      const result = await LearningService.startSession(userId, chu_de_id, wordCount);

      return ResponseUtil.success(res, result, 'Bắt đầu phiên học thành công', 201);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Nộp kết quả học từng từ (SRS)
   * POST /api/learning/result
   */
  static async submitResult(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { phien_hoc_tap_id, tu_vung_id, trang_thai } = req.body;

      if (!phien_hoc_tap_id || !tu_vung_id || !trang_thai) {
        return ResponseUtil.error(
          res,
          'Thiếu thông tin: phien_hoc_tap_id, tu_vung_id, trang_thai',
          'MISSING_FIELDS',
          400
        );
      }

      const validStatuses = ['da-nho', 'chua-chac', 'chua-nho'];
      if (!validStatuses.includes(trang_thai)) {
        return ResponseUtil.error(
          res,
          `trang_thai phải là một trong: ${validStatuses.join(', ')}`,
          'INVALID_STATUS',
          400
        );
      }

      const result = await LearningService.submitResult(userId, phien_hoc_tap_id, tu_vung_id, trang_thai);
      return ResponseUtil.success(res, result, 'Lưu kết quả thành công');
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Hoàn thành phiên học
   * POST /api/learning/complete
   */
  static async completeSession(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { phien_hoc_tap_id } = req.body;

      if (!phien_hoc_tap_id) {
        return ResponseUtil.error(res, 'Thiếu phien_hoc_tap_id', 'MISSING_FIELDS', 400);
      }

      const result = await LearningService.completeSession(userId, phien_hoc_tap_id);
      return ResponseUtil.success(res, result, 'Hoàn thành phiên học thành công');
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Lấy kết quả phiên học
   * GET /api/learning/result/:sessionId
   */
  static async getSessionResult(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { sessionId } = req.params;

      const result = await LearningService.getSessionResult(userId, sessionId);
      return ResponseUtil.success(res, result, 'Lấy kết quả thành công');
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Lấy danh sách từ cần ôn tập hôm nay
   * GET /api/learning/review
   */
  static async getReviewWords(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const limit = req.query.limit ? Math.min(parseInt(req.query.limit as string), 50) : 50;

      const result = await LearningService.getReviewWords(userId, limit);
      return ResponseUtil.success(res, result, 'Lấy từ cần ôn tập thành công');
    } catch (error: any) {
      next(error);
    }
  }
}
