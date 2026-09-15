import { NextFunction, Request, Response } from 'express';
import { AdminService } from '../services/admin.service';
import { ResponseUtil } from '../utils/response.util';
import { AdminReportService } from '../services/admin-report.service';

export class AdminController {
  static async getQuizStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AdminReportService.quiz({
        from: req.query.from as string | undefined,
        to: req.query.to as string | undefined,
        minAttempts: req.query.minAttempts ? Number(req.query.minAttempts) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      return ResponseUtil.success(res, data);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Dashboard thống kê admin
   * GET /api/admin/dashboard
   */
  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AdminService.getDashboard();
      return ResponseUtil.success(res, data, 'Lấy thống kê dashboard thành công');
    } catch (error: any) {
      return next(error);
    }
  }

  /**
   * Lấy danh sách người dùng
   * GET /api/admin/users
   */
  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, status, page, limit } = req.query;

      const result = await AdminService.getUsers({
        search: search as string,
        status: status as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      });

      return ResponseUtil.paginated(
        res,
        result.items,
        result.pagination.page,
        result.pagination.limit,
        result.pagination.total,
        'Lấy danh sách người dùng thành công'
      );
    } catch (error: any) {
      return next(error);
    }
  }

  /**
   * Cập nhật trạng thái người dùng (khóa/mở khóa)
   * PUT /api/admin/users/:userId/status
   */
  static async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { trang_thai } = req.body;

      if (!trang_thai) {
        return ResponseUtil.error(res, 'Thiếu trang_thai', 'MISSING_FIELDS', 400);
      }

      const result = await AdminService.updateUserStatus(userId, trang_thai);
      return ResponseUtil.success(res, result, 'Cập nhật trạng thái thành công');
    } catch (error: any) {
      return next(error);
    }
  }

  /**
   * Thống kê chi tiết
   * GET /api/admin/statistics
   */
  static async getStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AdminService.getStatistics();
      return ResponseUtil.success(res, data, 'Lấy thống kê thành công');
    } catch (error: any) {
      return next(error);
    }
  }
}
