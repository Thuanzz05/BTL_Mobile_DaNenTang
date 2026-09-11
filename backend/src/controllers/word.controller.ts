import { NextFunction, Request, Response } from 'express';
import { WordService } from '../services/word.service';
import { ResponseUtil } from '../utils/response.util';

export class WordController {
  /**
   * Lấy danh sách từ vựng theo chủ đề
   */
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { topicId, search, page, limit } = req.query;
      const userId = req.user?.id;

      if (topicId) {
        // Lấy theo chủ đề (mobile app)
        const words = await WordService.getByTopic(topicId as string, userId);
        return ResponseUtil.success(res, words, 'Lấy danh sách từ vựng thành công');
      }

      // Lấy tất cả (admin có thể search/filter)
      const result = await WordService.getAll({
        search: search as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      });

      return ResponseUtil.paginated(
        res,
        result.items,
        result.pagination.page,
        result.pagination.limit,
        result.pagination.total,
        'Lấy danh sách từ vựng thành công'
      );
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Lấy chi tiết từ vựng
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const word = await WordService.getById(id, userId);
      return ResponseUtil.success(res, word, 'Lấy thông tin từ vựng thành công');
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Tạo từ vựng mới (admin)
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { chu_de_id, tu_tieng_anh, nghia_tieng_viet, loai_tu } = req.body;

      if (!chu_de_id || !tu_tieng_anh || !nghia_tieng_viet || !loai_tu) {
        return ResponseUtil.error(
          res,
          'Thiếu thông tin bắt buộc: chu_de_id, tu_tieng_anh, nghia_tieng_viet, loai_tu',
          'MISSING_FIELDS',
          400
        );
      }

      const word = await WordService.create(req.body);
      return ResponseUtil.success(res, word, 'Tạo từ vựng thành công', 201);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Cập nhật từ vựng (admin)
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const word = await WordService.update(id, req.body);
      return ResponseUtil.success(res, word, 'Cập nhật từ vựng thành công');
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Xóa từ vựng (admin)
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await WordService.delete(id);
      return ResponseUtil.success(res, null, 'Xóa từ vựng thành công');
    } catch (error: any) {
      next(error);
    }
  }
}
