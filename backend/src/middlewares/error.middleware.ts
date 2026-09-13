import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/app-error';
import { ResponseUtil } from '../utils/response.util';

export const errorMiddleware = (error: any, _req: Request, res: Response, _next: NextFunction) => {
  // Lỗi kiểm tra dữ liệu đầu vào
  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    return ResponseUtil.error(res, 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400, details);
  }

  // Lỗi nghiệp vụ đã có mã và trạng thái HTTP cụ thể
  if (error instanceof AppError) {
    return ResponseUtil.error(res, error.message, error.code, error.statusCode);
  }

  // Lỗi định dạng JSON
  if (error.type === 'entity.parse.failed') {
    return ResponseUtil.error(res, 'JSON không hợp lệ', 'INVALID_JSON', 400);
  }

  // Lỗi kích thước dữ liệu hoặc file tải lên
  if (error.type === 'entity.too.large' || error.code === 'LIMIT_FILE_SIZE') {
    return ResponseUtil.error(
      res,
      'Dữ liệu vượt quá kích thước cho phép',
      'PAYLOAD_TOO_LARGE',
      413
    );
  }

  // Lỗi xử lý file multipart
  if (error.name === 'MulterError') {
    return ResponseUtil.error(res, 'File tải lên không hợp lệ', 'INVALID_UPLOAD', 400);
  }

  // Lỗi trùng dữ liệu trong database
  if (error.code === 'ER_DUP_ENTRY') {
    return ResponseUtil.error(res, 'Dữ liệu đã tồn tại', 'DUPLICATE_ERROR', 409);
  }

  // Lỗi xóa dữ liệu đang được tham chiếu
  if (error.code === 'ER_ROW_IS_REFERENCED_2') {
    return ResponseUtil.error(res, 'Dữ liệu đang được sử dụng', 'DATA_IN_USE', 409);
  }

  // Lỗi dữ liệu liên quan không tồn tại
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return ResponseUtil.error(res, 'Dữ liệu liên quan không tồn tại', 'INVALID_REFERENCE', 400);
  }

  // Không đưa câu SQL, token hoặc chi tiết nội bộ vào phản hồi
  console.error('Lỗi hệ thống:', error.code || error.name || 'UNKNOWN_ERROR');

  return ResponseUtil.serverError(res, 'Lỗi hệ thống. Vui lòng thử lại sau');
};
