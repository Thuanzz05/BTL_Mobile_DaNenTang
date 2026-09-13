import { RequestHandler } from 'express';
import { query } from '../config/database';
import { NguoiDung } from '../types/models';
import { AppError } from '../utils/app-error';
import { JwtUtil } from '../utils/jwt.util';

export const authMiddleware: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError('Vui lòng đăng nhập', 401, 'UNAUTHORIZED');
    }
    const payload = JwtUtil.verifyAccessToken(header.slice(7));
    if (!payload) {
      throw new AppError('Token không hợp lệ hoặc đã hết hạn', 401, 'UNAUTHORIZED');
    }
    const users = await query<NguoiDung[]>(
      'SELECT id, email, vai_tro, trang_thai, token_version FROM nguoi_dung WHERE id = ?',
      [payload.id]
    );
    const user = users[0];
    if (!user) {
      throw new AppError('Người dùng không tồn tại', 401, 'UNAUTHORIZED');
    }
    if (user.trang_thai !== 'active') {
      throw new AppError('Tài khoản không hoạt động hoặc đã bị khóa', 403, 'ACCOUNT_DISABLED');
    }
    if (user.token_version !== payload.token_version) {
      throw new AppError('Phiên đăng nhập đã hết hiệu lực', 401, 'SESSION_REVOKED');
    }
    req.user = { id: user.id, email: user.email, vai_tro: user.vai_tro };
    return next();
  } catch (error) {
    return next(error);
  }
};

export const optionalAuthMiddleware: RequestHandler = (req, res, next) => {
  if (req.headers.authorization) {
    return authMiddleware(req, res, next);
  }
  return next();
};
