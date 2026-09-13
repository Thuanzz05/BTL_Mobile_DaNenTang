import { NextFunction, Request, Response } from 'express';
import { HomeService } from '../services/home.service';
import { ResponseUtil } from '../utils/response.util';

export class HomeController {
  /**
   * Lấy dữ liệu trang chủ của người học
   * GET /api/home/dashboard
   */
  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const dashboard = await HomeService.getDashboard(userId);

      return ResponseUtil.success(res, dashboard, 'Lấy trang chủ thành công');
    } catch (error) {
      return next(error);
    }
  }
}
