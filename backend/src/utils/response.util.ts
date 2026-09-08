import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types/models';

export class ResponseUtil {
  static success<T>(res: Response, data: T, message = 'Thành công', statusCode = 200) {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
    };
    return res.status(statusCode).json(response);
  }

  static error(res: Response, message: string, code: string = 'ERROR', statusCode = 400, details?: any) {
    const response: ApiResponse = {
      success: false,
      message,
      error: {
        code,
        details,
      },
    };
    return res.status(statusCode).json(response);
  }

  static paginated<T>(
    res: Response,
    items: T[],
    page: number,
    limit: number,
    total: number,
    message = 'Lấy dữ liệu thành công'
  ) {
    const response: ApiResponse<PaginatedResponse<T>> = {
      success: true,
      message,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
    return res.status(200).json(response);
  }

  static unauthorized(res: Response, message = 'Không có quyền truy cập') {
    return this.error(res, message, 'UNAUTHORIZED', 401);
  }

  static forbidden(res: Response, message = 'Truy cập bị cấm') {
    return this.error(res, message, 'FORBIDDEN', 403);
  }

  static notFound(res: Response, message = 'Không tìm thấy dữ liệu') {
    return this.error(res, message, 'NOT_FOUND', 404);
  }

  static serverError(res: Response, message = 'Lỗi hệ thống') {
    return this.error(res, message, 'SERVER_ERROR', 500);
  }
}
