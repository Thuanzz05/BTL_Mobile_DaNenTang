import { query } from '../config/database';
import { NguoiDung } from '../types/models';
import { JwtUtil } from '../utils/jwt.util';
import { PasswordUtil } from '../utils/password.util';
import { UuidUtil } from '../utils/uuid.util';

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
  // Đăng ký
  static async register(data: RegisterDto) {
    // Kiểm tra email đã tồn tại
    const existingUser = await query<NguoiDung[]>(
      'SELECT id FROM nguoi_dung WHERE email = ?',
      [data.email]
    );

    if (existingUser.length > 0) {
      throw new Error('Email đã được sử dụng');
    }

    // Hash password
    const mat_khau_hash = await PasswordUtil.hash(data.mat_khau);

    // Tạo user mới
    const id = UuidUtil.generate();
    await query(
      `INSERT INTO nguoi_dung (id, ho_ten, email, mat_khau_hash, phuong_thuc_dang_nhap, vai_tro, trang_thai)
       VALUES (?, ?, ?, ?, 'local', 'user', 'active')`,
      [id, data.ho_ten, data.email, mat_khau_hash]
    );

    return {
      id,
      ho_ten: data.ho_ten,
      email: data.email,
    };
  }

  // Đăng nhập
  static async login(data: LoginDto) {
    // Tìm user theo email
    const users = await query<NguoiDung[]>(
      'SELECT * FROM nguoi_dung WHERE email = ?',
      [data.email]
    );

    if (users.length === 0) {
      throw new Error('Email hoặc mật khẩu không chính xác');
    }

    const user = users[0];

    // Kiểm tra trạng thái
    if (user.trang_thai === 'locked') {
      throw new Error('Tài khoản đã bị khóa');
    }

    if (user.trang_thai === 'inactive') {
      throw new Error('Tài khoản chưa được kích hoạt');
    }

    // Verify password
    if (!user.mat_khau_hash) {
      throw new Error('Tài khoản này sử dụng phương thức đăng nhập khác');
    }

    const isValidPassword = await PasswordUtil.verify(data.mat_khau, user.mat_khau_hash);

    if (!isValidPassword) {
      throw new Error('Email hoặc mật khẩu không chính xác');
    }

    // Tạo tokens
    const tokens = JwtUtil.generateTokenPair({
      id: user.id,
      email: user.email,
      vai_tro: user.vai_tro,
    });

    // Lưu refresh token vào database
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        ho_ten: user.ho_ten,
        email: user.email,
        anh_dai_dien: user.anh_dai_dien,
        vai_tro: user.vai_tro,
      },
      ...tokens,
    };
  }

  // Lưu refresh token
  static async saveRefreshToken(nguoi_dung_id: string, token: string) {
    const id = UuidUtil.generate();
    const thoi_gian_het_han = new Date();
    thoi_gian_het_han.setDate(thoi_gian_het_han.getDate() + 30); // 30 ngày

    await query(
      `INSERT INTO token_lam_moi (id, nguoi_dung_id, token, thoi_gian_het_han)
       VALUES (?, ?, ?, ?)`,
      [id, nguoi_dung_id, token, thoi_gian_het_han]
    );
  }

  // Refresh token
  static async refreshToken(refreshToken: string) {
    // Verify refresh token
    const payload = JwtUtil.verifyRefreshToken(refreshToken);

    if (!payload) {
      throw new Error('Refresh token không hợp lệ');
    }

    // Kiểm tra token trong database
    const tokens = await query<any[]>(
      `SELECT * FROM token_lam_moi 
       WHERE token = ? AND da_thu_hoi = FALSE AND thoi_gian_het_han > NOW()`,
      [refreshToken]
    );

    if (tokens.length === 0) {
      throw new Error('Refresh token không hợp lệ hoặc đã hết hạn');
    }

    // Tạo access token mới
    const newAccessToken = JwtUtil.generateAccessToken({
      id: payload.id,
      email: payload.email,
      vai_tro: payload.vai_tro,
    });

    return {
      accessToken: newAccessToken,
    };
  }

  // Đăng xuất
  static async logout(refreshToken: string) {
    await query(
      'UPDATE token_lam_moi SET da_thu_hoi = TRUE WHERE token = ?',
      [refreshToken]
    );
  }

  // Lấy thông tin user hiện tại
  static async getMe(userId: string) {
    const users = await query<NguoiDung[]>(
      'SELECT id, ho_ten, email, anh_dai_dien, vai_tro, trang_thai FROM nguoi_dung WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      throw new Error('Không tìm thấy người dùng');
    }

    return users[0];
  }
}
