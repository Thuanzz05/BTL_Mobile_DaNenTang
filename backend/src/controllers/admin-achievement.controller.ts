import { NextFunction, Request, Response } from 'express';
import { AdminAchievementService } from '../services/admin-achievement.service';
import { ResponseUtil } from '../utils/response.util';
import { achievementListQuerySchema } from '../validations/achievement.schemas';

export class AdminAchievementController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminAchievementService.list(
        achievementListQuerySchema.parse(req.query)
      );
      return ResponseUtil.paginated(res, result.items, result.page, result.limit, result.total);
    } catch (error) {
      return next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminAchievementService.create(req.body);
      return ResponseUtil.success(res, result, 'Đã tạo thành tích', 201);
    } catch (error) {
      return next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminAchievementService.update(req.params.id, req.body);
      return ResponseUtil.success(res, result, 'Đã cập nhật thành tích');
    } catch (error) {
      return next(error);
    }
  }

  static async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminAchievementService.remove(req.params.id);
      return ResponseUtil.success(res, result, 'Đã xóa thành tích');
    } catch (error) {
      return next(error);
    }
  }

  static async recipients(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminAchievementService.recipients(
        req.params.id,
        achievementListQuerySchema.parse(req.query)
      );
      return ResponseUtil.success(res, result);
    } catch (error) {
      return next(error);
    }
  }
}
