import { NextFunction, Request, Response } from 'express';
import { UploadService } from '../services/upload.service';
import { ResponseUtil } from '../utils/response.util';

export class UploadController {
  /**
   * Upload ảnh minh họa JPG/PNG, tối đa 2 MB
   */
  static async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UploadService.save('image', req.file);

      return ResponseUtil.success(res, result, 'Tải ảnh thành công', 201);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Upload âm thanh MP3, tối đa 5 MB
   */
  static async uploadAudio(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UploadService.save('audio', req.file);

      return ResponseUtil.success(res, result, 'Tải âm thanh thành công', 201);
    } catch (error) {
      return next(error);
    }
  }
}
