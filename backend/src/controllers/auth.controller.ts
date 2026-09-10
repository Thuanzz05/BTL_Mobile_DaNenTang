import { NextFunction, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { ResponseUtil } from '../utils/response.util';

export class AuthController {
  /**
   * Đăng ký người dùng mới
   */
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { ho_ten, email, mat_khau } = req.body;

      if (!ho_ten || !email || !mat_khau) {
        return ResponseUtil.error(res, 'Thiếu thông tin bắt buộc: ho_ten, email, mat_khau', 'MISSING_FIELDS', 400);
      }

      const result = await AuthService.register({ ho_ten, email, mat_khau });
      return ResponseUtil.success(res, result, 'Đăng ký thành công', 201);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Đăng nhập
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, mat_khau } = req.body;

      if (!email || !mat_khau) {
        return ResponseUtil.error(res, 'Email và mật khẩu là bắt buộc', 'MISSING_FIELDS', 400);
      }

      const result = await AuthService.login({ email, mat_khau });
      return ResponseUtil.success(res, result, 'Đăng nhập thành công');
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Lấy thông tin hồ sơ người dùng hiện tại
   */
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const user = await AuthService.getUserById(userId);

      if (!user) {
        return ResponseUtil.notFound(res, 'Không tìm thấy người dùng');
      }

      return ResponseUtil.success(res, user, 'Lấy thông tin thành công');
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Cập nhật hồ sơ người dùng
   */
  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { ho_ten, anh_dai_dien } = req.body;

      const updated = await AuthService.updateProfile(userId, { ho_ten, anh_dai_dien });
      return ResponseUtil.success(res, updated, 'Cập nhật hồ sơ thành công');
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Đổi mật khẩu
   */
  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { mat_khau_cu, mat_khau_moi } = req.body;

      if (!mat_khau_cu || !mat_khau_moi) {
        return ResponseUtil.error(res, 'Thiếu thông tin mật khẩu', 'MISSING_FIELDS', 400);
      }

      const result = await AuthService.changePassword(userId, mat_khau_cu, mat_khau_moi);
      return ResponseUtil.success(res, result, 'Đổi mật khẩu thành công');
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Refresh token
   */
  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return ResponseUtil.error(res, 'Thiếu refresh token', 'MISSING_FIELDS', 400);
      }

      const result = await AuthService.refreshToken(refreshToken);
      return ResponseUtil.success(res, result, 'Làm mới token thành công');
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Đăng xuất
   */
  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      await AuthService.logout(refreshToken);
      return ResponseUtil.success(res, null, 'Đăng xuất thành công');
    } catch (error: any) {
      next(error);
    }
  }
}
