import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { query, transaction } from '../config/database';
import { NguoiDung } from '../types/models';
import { AppError } from '../utils/app-error';
import { JwtUtil } from '../utils/jwt.util';
import { PasswordUtil } from '../utils/password.util';
import { UuidUtil } from '../utils/uuid.util';
import { schemas } from '../validations/request.schemas';
import { PasswordResetEmailService } from './password-reset-email.service';

export interface RegisterDto {
  ho_ten: string;
  email: string;
  mat_khau: string;
}
export interface LoginDto {
  email: string;
  mat_khau: string;
}

export class AuthService {
  private static resetCodeHash(userId: string, code: string) {
    return createHmac('sha256', process.env.JWT_SECRET!).update(`${userId}:${code}`).digest('hex');
  }

  /**
   * Đăng ký tài khoản local và kiểm tra email trùng
   */
  static async register(input: RegisterDto) {
    const data = schemas.register.parse(input);

    const existing = await query<any[]>('SELECT id FROM nguoi_dung WHERE email = ?', [data.email]);
    if (existing.length) {
      throw new AppError('Email đã được sử dụng', 409, 'EMAIL_EXISTS');
    }

    const id = UuidUtil.generate();

    const hash = await PasswordUtil.hash(data.mat_khau);
    await query(`INSERT INTO nguoi_dung (id, ho_ten, email, mat_khau_hash) VALUES (?, ?, ?, ?)`, [
      id,
      data.ho_ten,
      data.email,
      hash,
    ]);

    return { id, ho_ten: data.ho_ten, email: data.email };
  }

  /**
   * Xác thực mật khẩu, kiểm tra trạng thái tài khoản và cấp token
   */
  static async login(input: LoginDto) {
    const data = schemas.login.parse(input);

    const users = await query<NguoiDung[]>('SELECT * FROM nguoi_dung WHERE email = ?', [
      data.email,
    ]);

    const user = users[0];
    if (!user?.mat_khau_hash || !(await PasswordUtil.verify(data.mat_khau, user.mat_khau_hash))) {
      throw new AppError('Email hoặc mật khẩu không chính xác', 401, 'INVALID_CREDENTIALS');
    }
    if (user.trang_thai !== 'active') {
      throw new AppError('Tài khoản không hoạt động hoặc đã bị khóa', 403, 'ACCOUNT_DISABLED');
    }

    const tokens = JwtUtil.generateTokenPair({
      id: user.id,
      email: user.email,
      vai_tro: user.vai_tro,
      token_version: user.token_version,
    });

    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        ho_ten: user.ho_ten,
        email: user.email,
        anh_dai_dien: user.anh_dai_dien,
        muc_tieu_hang_ngay: user.muc_tieu_hang_ngay,
        vai_tro: user.vai_tro,
      },
      ...tokens,
    };
  }

  /**
   * Lưu refresh token với thời gian hết hạn khớp JWT
   */
  static async saveRefreshToken(userId: string, token: string) {
    const payload = JwtUtil.verifyRefreshToken(token);
    if (!payload?.exp) {
      throw new AppError('Refresh token không hợp lệ', 401, 'INVALID_TOKEN');
    }
    await query(
      `INSERT INTO token_lam_moi (id, nguoi_dung_id, token, thoi_gian_het_han) VALUES (?, ?, ?, ?)`,
      [UuidUtil.generate(), userId, token, new Date(payload.exp * 1000)]
    );
  }

  /**
   * Kiểm tra token còn hiệu lực và lấy quyền hiện tại từ database
   */
  static async refreshToken(refreshToken: string) {
    const payload = JwtUtil.verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new AppError('Refresh token không hợp lệ', 401, 'INVALID_TOKEN');
    }

    return transaction(async (connection) => {
      const [users]: any = await connection.execute(
        'SELECT * FROM nguoi_dung WHERE id = ? FOR UPDATE',
        [payload.id]
      );
      const user = users[0];
      if (!user) {
        throw new AppError('Phiên đăng nhập không hợp lệ', 401, 'INVALID_TOKEN');
      }
      if (user.trang_thai !== 'active') {
        throw new AppError('Tài khoản không hoạt động hoặc đã bị khóa', 403, 'ACCOUNT_DISABLED');
      }
      if (user.token_version !== payload.token_version) {
        throw new AppError('Phiên đăng nhập đã hết hiệu lực', 401, 'SESSION_REVOKED');
      }
      const [tokens]: any = await connection.execute(
        `SELECT id FROM token_lam_moi WHERE token = ? AND nguoi_dung_id = ?
         AND da_thu_hoi = FALSE AND thoi_gian_het_han > NOW() FOR UPDATE`,
        [refreshToken, user.id]
      );
      if (!tokens.length) {
        throw new AppError('Refresh token đã hết hạn hoặc bị thu hồi', 401, 'INVALID_TOKEN');
      }
      return {
        accessToken: JwtUtil.generateAccessToken({
          id: user.id,
          email: user.email,
          vai_tro: user.vai_tro,
          token_version: user.token_version,
        }),
      };
    });
  }

  /**
   * Thu hồi refresh token thuộc người dùng đang đăng nhập
   */
  static async logout(refreshToken: string, userId: string) {
    await query(
      'UPDATE token_lam_moi SET da_thu_hoi = TRUE WHERE token = ? AND nguoi_dung_id = ?',
      [refreshToken, userId]
    );
  }

  /**
   * Lấy hồ sơ, không trả mật khẩu hoặc thông tin token
   */
  static async getUserById(userId: string) {
    const users = await query<NguoiDung[]>(
      'SELECT id, ho_ten, email, anh_dai_dien, muc_tieu_hang_ngay, vai_tro, trang_thai, ngay_tao FROM nguoi_dung WHERE id = ?',
      [userId]
    );

    return users[0] || null;
  }

  /**
   * Lấy hồ sơ người dùng hiện tại
   */
  static async getMe(userId: string) {
    return this.getUserById(userId);
  }

  /**
   * Cập nhật các trường được phép của hồ sơ
   */
  static async updateProfile(
    userId: string,
    input: {
      ho_ten?: string;
      anh_dai_dien?: string | null;
      muc_tieu_hang_ngay?: 5 | 10 | 20;
    }
  ) {
    const data = schemas.profile.parse(input);

    const fields: string[] = [];
    const params: any[] = [];
    for (const field of ['ho_ten', 'anh_dai_dien', 'muc_tieu_hang_ngay'] as const) {
      if (data[field] !== undefined) {
        fields.push(field + ' = ?');
        params.push(data[field]);
      }
    }
    if (fields.length) {
      await query('UPDATE nguoi_dung SET ' + fields.join(', ') + ' WHERE id = ?', [
        ...params,
        userId,
      ]);
    }

    return this.getUserById(userId);
  }

  /**
   * Đổi mật khẩu và thu hồi các phiên đăng nhập cũ trong cùng giao dịch
   */
  static async changePassword(userId: string, mat_khau_cu: string, mat_khau_moi: string) {
    schemas.password.parse({ mat_khau_cu, mat_khau_moi });

    return transaction(async (connection) => {
      const [users]: any = await connection.execute(
        'SELECT mat_khau_hash FROM nguoi_dung WHERE id = ? FOR UPDATE',
        [userId]
      );
      if (!users[0]?.mat_khau_hash) {
        throw new AppError('Tài khoản không sử dụng mật khẩu');
      }
      if (!(await PasswordUtil.verify(mat_khau_cu, users[0].mat_khau_hash))) {
        throw new AppError('Mật khẩu cũ không chính xác');
      }
      const hash = await PasswordUtil.hash(mat_khau_moi);
      await connection.execute(
        'UPDATE nguoi_dung SET mat_khau_hash = ?, token_version = token_version + 1 WHERE id = ?',
        [hash, userId]
      );
      await connection.execute(
        'UPDATE token_lam_moi SET da_thu_hoi = TRUE WHERE nguoi_dung_id = ?',
        [userId]
      );
      return { success: true, requiresLogin: true };
    });
  }

  /**
   * Tạo mã xác nhận 6 số. Phản hồi không tiết lộ email có tồn tại hay không.
   */
  static async requestPasswordReset(input: { email: string }) {
    const data = schemas.forgotPassword.parse(input);
    const users = await query<NguoiDung[]>(
      `SELECT id, ho_ten, email, mat_khau_hash, trang_thai FROM nguoi_dung
       WHERE email = ? AND phuong_thuc_dang_nhap = 'local'`,
      [data.email]
    );
    const user = users[0];
    if (!user?.mat_khau_hash || user.trang_thai !== 'active') {
      return { expiresInMinutes: 10 };
    }

    const code = String(randomInt(100000, 1000000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await transaction(async (connection) => {
      await connection.execute('DELETE FROM ma_dat_lai_mat_khau WHERE nguoi_dung_id = ?', [
        user.id,
      ]);
      await connection.execute(
        `INSERT INTO ma_dat_lai_mat_khau
          (id, nguoi_dung_id, ma_hash, het_han_luc) VALUES (?, ?, ?, ?)`,
        [UuidUtil.generate(), user.id, this.resetCodeHash(user.id, code), expiresAt]
      );
    });

    const sent = await PasswordResetEmailService.send(user.email, user.ho_ten, code);
    const exposeDevelopmentCode =
      process.env.NODE_ENV === 'test' ||
      (process.env.NODE_ENV === 'development' && process.env.PASSWORD_RESET_EXPOSE_CODE === 'true');
    return {
      expiresInMinutes: 10,
      ...(exposeDevelopmentCode && !sent ? { ma_xac_nhan_thu_nghiem: code } : {}),
    };
  }

  /**
   * Xác nhận mã một lần, đổi mật khẩu và thu hồi toàn bộ phiên cũ.
   */
  static async resetPassword(input: { email: string; ma_xac_nhan: string; mat_khau_moi: string }) {
    const data = schemas.resetPassword.parse(input);
    const passwordHash = await PasswordUtil.hash(data.mat_khau_moi);
    const changed = await transaction(async (connection) => {
      const [rows]: any = await connection.execute(
        `SELECT m.id, m.nguoi_dung_id, m.ma_hash
         FROM ma_dat_lai_mat_khau m JOIN nguoi_dung n ON n.id = m.nguoi_dung_id
         WHERE n.email = ? AND n.trang_thai = 'active'
           AND m.da_su_dung_luc IS NULL AND m.het_han_luc > NOW() AND m.so_lan_thu < 5
         ORDER BY m.ngay_tao DESC LIMIT 1 FOR UPDATE`,
        [data.email]
      );
      const reset = rows[0];
      if (!reset) {
        return false;
      }

      const received = Buffer.from(this.resetCodeHash(reset.nguoi_dung_id, data.ma_xac_nhan));
      const expected = Buffer.from(reset.ma_hash);
      if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
        await connection.execute(
          'UPDATE ma_dat_lai_mat_khau SET so_lan_thu = so_lan_thu + 1 WHERE id = ?',
          [reset.id]
        );
        return false;
      }

      await connection.execute(
        `UPDATE nguoi_dung SET mat_khau_hash = ?, token_version = token_version + 1
         WHERE id = ?`,
        [passwordHash, reset.nguoi_dung_id]
      );
      await connection.execute(
        'UPDATE ma_dat_lai_mat_khau SET da_su_dung_luc = NOW() WHERE nguoi_dung_id = ? AND da_su_dung_luc IS NULL',
        [reset.nguoi_dung_id]
      );
      await connection.execute(
        'UPDATE token_lam_moi SET da_thu_hoi = TRUE WHERE nguoi_dung_id = ?',
        [reset.nguoi_dung_id]
      );
      return true;
    });

    if (!changed) {
      throw new AppError('Mã xác nhận không đúng hoặc đã hết hạn', 400, 'INVALID_RESET_CODE');
    }
    return { success: true };
  }
}
