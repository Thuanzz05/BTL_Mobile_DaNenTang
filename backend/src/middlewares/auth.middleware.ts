import { NextFunction, Request, Response } from 'express';
import { JwtUtil } from '../utils/jwt.util';
import { ResponseUtil } from '../utils/response.util';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseUtil.unauthorized(res, 'Vui lòng đăng nhập');
    }

    const token = authHeader.substring(7); // Bỏ "Bearer "

    // Verify token
    const payload = JwtUtil.verifyAccessToken(token);

    if (!payload) {
      return ResponseUtil.unauthorized(res, 'Token không hợp lệ hoặc đã hết hạn');
    }

    // Gán user vào request (payload.id từ JwtUtil)
    req.user = {
      id: payload.id,
      email: payload.email,
      vai_tro: payload.vai_tro,
    };

    next();
  } catch (error) {
    return ResponseUtil.unauthorized(res, 'Xác thực thất bại');
  }
};
