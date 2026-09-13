import { RequestHandler } from 'express';
import { ZodTypeAny } from 'zod';

/**
 * Kiểm tra và chuẩn hóa dữ liệu trước khi chuyển đến controller
 */
export function validate(
  schema: ZodTypeAny,
  source: 'body' | 'query' | 'params' = 'body'
): RequestHandler {
  return (req, _res, next) => {
    try {
      req[source] = schema.parse(req[source]);

      return next();
    } catch (error) {
      return next(error);
    }
  };
}
