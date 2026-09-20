import { NextFunction, Request, Response } from 'express';
import { AchievementService } from '../services/achievement.service';
import { ResponseUtil } from '../utils/response.util';

export class AchievementController {
  static async getAchievements(req: Request, res: Response, next: NextFunction) {
    try {
      const achievements = await AchievementService.getForUser(req.user!.id);
      return ResponseUtil.success(res, achievements, 'Lấy thành tích thành công');
    } catch (error) {
      return next(error);
    }
  }
}
