import { NextFunction, Request, Response } from 'express';
import { ResponseUtil } from '../utils/response.util';

export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return ResponseUtil.unauthorized(res, 'Vui lòng đăng nhập');
  }

  if (req.user.vai_tro !== 'admin') {
    return ResponseUtil.forbidden(res, 'Chỉ admin mới có quyền truy cập');
  }

  next();
};
