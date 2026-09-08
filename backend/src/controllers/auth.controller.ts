import { NextFunction, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { ResponseUtil } from '../utils/response.util';

export class AuthController {
  /**
   * Register new user
   */
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { fullName, email, password } = req.body;
      
      if (!fullName || !email || !password) {
        return ResponseUtil.error(res, 'Thiếu thông tin bắt buộc', 400);
      }

      const result = await AuthService.register({ fullName, email, password });
      return ResponseUtil.success(res, result, 'Đăng ký thành công', 201);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * User login
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return ResponseUtil.error(res, 'Email và password là bắt buộc', 400);
      }

      const result = await AuthService.login({ email, password });
      return ResponseUtil.success(res, result, 'Đăng nhập thành công');
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const user = await AuthService.getUserById(userId);
      
      if (!user) {
        return ResponseUtil.error(res, 'Không tìm thấy người dùng', 404);
      }

      return ResponseUtil.success(res, user, 'Lấy thông tin thành công');
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Logout
   */
  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // In a real app, you might want to blacklist the token
      return ResponseUtil.success(res, null, 'Đăng xuất thành công');
    } catch (error: any) {
      next(error);
    }
  }
}
