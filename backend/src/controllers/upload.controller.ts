import { NextFunction, Request, Response } from 'express';
import { UploadService } from '../services/upload.service';
import { ResponseUtil } from '../utils/response.util';

export class UploadController {
  /**
   * Upload ảnh minh họa JPG/PNG, tối đa 2 MB
   */
  static async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UploadService.save(req.file);

      return ResponseUtil.success(res, result, 'Tải ảnh thành công', 201);
    } catch (error) {
      return next(error);
    }
  }
}
