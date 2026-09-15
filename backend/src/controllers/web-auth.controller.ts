import { CookieOptions, NextFunction, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AppError } from '../utils/app-error';
import { JwtUtil } from '../utils/jwt.util';
import { ResponseUtil } from '../utils/response.util';

const COOKIE_NAME = 'wordleaf_admin_refresh';

function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: (process.env.API_PREFIX || '/api') + '/web-auth',
  };
}

function readToken(req: Request) {
  const cookie = req.headers.cookie
    ?.split(';')
    .find((part) => part.trim().startsWith(COOKIE_NAME + '='));

  try {
    return cookie ? decodeURIComponent(cookie.trim().slice(COOKIE_NAME.length + 1)) : '';
  } catch {
    throw new AppError('Cookie đăng nhập không hợp lệ', 401, 'INVALID_TOKEN');
  }
}

export class WebAuthController {
  /** Chỉ admin được nhận cookie; refresh token không xuất hiện trong JSON. */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const session = await AuthService.login(req.body);

      if (session.user.vai_tro !== 'admin') {
        await AuthService.logout(session.refreshToken, session.user.id);
        throw new AppError('Tài khoản không có quyền quản trị', 403, 'ADMIN_REQUIRED');
      }

      const payload = JwtUtil.verifyRefreshToken(session.refreshToken)!;
      res.cookie(COOKIE_NAME, session.refreshToken, {
        ...cookieOptions(),
        expires: new Date(payload.exp! * 1000),
      });

      return ResponseUtil.success(res, { user: session.user, accessToken: session.accessToken });
    } catch (error) {
      return next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token = readToken(req);
      const result = await AuthService.refreshToken(token);
      const payload = JwtUtil.verifyAccessToken(result.accessToken)!;
      const user = await AuthService.getMe(payload.id);

      if (user?.vai_tro !== 'admin') {
        await AuthService.logout(token, payload.id);
        throw new AppError('Tài khoản không có quyền quản trị', 403, 'ADMIN_REQUIRED');
      }

      return ResponseUtil.success(res, { ...result, user });
    } catch (error) {
      if (error instanceof AppError && [401, 403].includes(error.statusCode)) {
        res.clearCookie(COOKIE_NAME, cookieOptions());
      }

      return next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = readToken(req);
      const payload = JwtUtil.verifyRefreshToken(token);

      if (payload) {
        await AuthService.logout(token, payload.id);
      }

      res.clearCookie(COOKIE_NAME, cookieOptions());
      return ResponseUtil.success(res, { success: true }, 'Đã đăng xuất');
    } catch (error) {
      return next(error);
    }
  }
}
