import { NextFunction, Request, Response } from 'express';
import { FavoriteService } from '../services/favorite.service';
import { ResponseUtil } from '../utils/response.util';

export class FavoriteController {
  /**
   * Lấy danh sách từ yêu thích
   * GET /api/favorites
   */
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const favorites = await FavoriteService.getAll(userId);
      return ResponseUtil.success(res, favorites, 'Lấy danh sách yêu thích thành công');
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Thêm/bỏ yêu thích (toggle)
   * POST /api/favorites/:wordId
   */
  static async toggle(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { wordId } = req.params;

      const result = await FavoriteService.toggle(userId, wordId);
      const statusCode = result.added ? 201 : 200;
      return ResponseUtil.success(res, result, result.message, statusCode);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Xóa khỏi yêu thích
   * DELETE /api/favorites/:wordId
   */
  static async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { wordId } = req.params;

      const result = await FavoriteService.remove(userId, wordId);
      return ResponseUtil.success(res, result, 'Đã bỏ khỏi yêu thích');
    } catch (error: any) {
      next(error);
    }
  }
}
