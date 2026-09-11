import { NextFunction, Request, Response } from 'express';
import { HistoryService } from '../services/history.service';
import { ResponseUtil } from '../utils/response.util';

export class HistoryController {
  /**
   * Lấy lịch sử học tập (paginated)
   * GET /api/history
   */
  static async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? Math.min(parseInt(req.query.limit as string), 50) : 20;

      const result = await HistoryService.getUserHistory(userId, page, limit);

      return ResponseUtil.paginated(
        res,
        result.sessions,
        result.pagination.page,
        result.pagination.limit,
        result.pagination.total,
        'Lấy lịch sử học tập thành công'
      );
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Lấy chi tiết phiên học
   * GET /api/history/:sessionId
   */
  static async getSessionDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { sessionId } = req.params;

      const result = await HistoryService.getSessionDetail(sessionId, userId);
      return ResponseUtil.success(res, result, 'Lấy chi tiết phiên học thành công');
    } catch (error: any) {
      next(error);
    }
  }
}
