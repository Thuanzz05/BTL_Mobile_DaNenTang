import { NextFunction, Request, Response } from 'express';
import { ResponseUtil } from '../utils/response.util';

export const errorMiddleware = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('❌ Error:', error);

  // Lỗi validation
  if (error.name === 'ValidationError') {
    return ResponseUtil.error(res, 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400, error.errors);
  }

  // Lỗi database
  if (error.code === 'ER_DUP_ENTRY') {
    return ResponseUtil.error(res, 'Dữ liệu đã tồn tại', 'DUPLICATE_ERROR', 409);
  }

  // Lỗi mặc định
  return ResponseUtil.serverError(res, error.message || 'Lỗi hệ thống');
};
