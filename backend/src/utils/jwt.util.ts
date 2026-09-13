import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export interface TokenPayload {
  id: string;
  email: string;
  vai_tro: 'user' | 'admin';
  token_version: number;
}

function secret(name: 'JWT_SECRET' | 'REFRESH_TOKEN_SECRET'): string {
  const value = process.env[name];
  if (!value || value.length < 32 || value.startsWith('your-')) {
    throw new Error(`${name} phải được cấu hình bằng khóa ngẫu nhiên ít nhất 32 ký tự`);
  }
  return value;
}

function duration(value: string): number {
  const match = /^(\d+)(s|m|h|d)$/.exec(value);
  if (!match) {
    throw new Error('Thời hạn token phải có dạng 15m, 1h hoặc 30d');
  }
  const seconds = Number(match[1]) * { s: 1, m: 60, h: 3600, d: 86400 }[match[2]]!;
  if (!Number.isSafeInteger(seconds) || seconds <= 0) {
    throw new Error('Thời hạn token không hợp lệ');
  }
  return seconds;
}

export class JwtUtil {
  static validateConfig() {
    if (secret('JWT_SECRET') === secret('REFRESH_TOKEN_SECRET')) {
      throw new Error('Khóa access token và refresh token phải khác nhau');
    }
    duration(process.env.JWT_EXPIRES_IN || '7d');
    duration(process.env.REFRESH_TOKEN_EXPIRES_IN || '30d');
  }

  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign({ ...payload, type: 'access' }, secret('JWT_SECRET'), {
      algorithm: 'HS256',
      expiresIn: duration(process.env.JWT_EXPIRES_IN || '7d'),
    });
  }

  static generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(
      { ...payload, type: 'refresh', jti: uuidv4() },
      secret('REFRESH_TOKEN_SECRET'),
      {
        algorithm: 'HS256',
        expiresIn: duration(process.env.REFRESH_TOKEN_EXPIRES_IN || '30d'),
      }
    );
  }

  private static verify(token: string, type: 'access' | 'refresh') {
    const key = secret(type === 'access' ? 'JWT_SECRET' : 'REFRESH_TOKEN_SECRET');
    try {
      const decoded = jwt.verify(token, key, { algorithms: ['HS256'] });
      if (
        typeof decoded === 'string' ||
        decoded.type !== type ||
        typeof decoded.id !== 'string' ||
        typeof decoded.email !== 'string' ||
        !['user', 'admin'].includes(decoded.vai_tro) ||
        !Number.isInteger(decoded.token_version) ||
        typeof decoded.exp !== 'number'
      ) {
        return null;
      }
      return decoded as jwt.JwtPayload & TokenPayload;
    } catch {
      return null;
    }
  }

  static verifyAccessToken(token: string) {
    return this.verify(token, 'access');
  }

  static verifyRefreshToken(token: string) {
    const payload = this.verify(token, 'refresh');
    return payload && typeof payload.jti === 'string' ? payload : null;
  }

  static generateTokenPair(payload: TokenPayload) {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }
}
