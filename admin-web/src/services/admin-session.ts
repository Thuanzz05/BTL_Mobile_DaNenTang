import type { Session } from '../types';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code = ''
  ) {
    super(message);
  }
}
export type Transport = <T>(path: string, options?: RequestInit) => Promise<T>;

/** Access token chỉ ở bộ nhớ; trình duyệt tự gửi cookie HttpOnly khi khôi phục phiên. */
export class AdminSession {
  private session: Session | null = null;
  private listeners = new Set<() => void>();
  private pending: Promise<Session> | null = null;
  private generation = 0;

  constructor(private transport: Transport) {}

  getSnapshot = () => this.session;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private update(session: Session | null) {
    this.session = session;
    this.listeners.forEach((listener) => listener());
  }

  clear() {
    this.generation += 1;
    this.pending = null;
    this.update(null);
  }

  async login(email: string, password: string) {
    const generation = ++this.generation;
    this.pending = null;
    const session = await this.transport<Session>('/web-auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase(), mat_khau: password }),
    });

    if (session.user.vai_tro !== 'admin') {
      throw new ApiError('Tài khoản không có quyền quản trị.', 403, 'ADMIN_REQUIRED');
    }
    if (generation === this.generation) {
      this.update(session);
    }
  }

  restore(): Promise<Session> {
    if (this.pending) {
      return this.pending;
    }

    const generation = this.generation;
    const request = this.transport<Session>('/web-auth/refresh', { method: 'POST' })
      .then((session) => {
        if (generation !== this.generation) {
          throw new ApiError('Phiên đăng nhập đã thay đổi.', 401);
        }
        if (session.user.vai_tro !== 'admin') {
          throw new ApiError('Tài khoản không có quyền quản trị.', 403, 'ADMIN_REQUIRED');
        }

        this.update(session);
        return session;
      })
      .catch((error) => {
        if (
          generation === this.generation &&
          error instanceof ApiError &&
          [401, 403].includes(error.status)
        ) {
          this.clear();
        }
        throw error;
      })
      .finally(() => {
        if (this.pending === request) {
          this.pending = null;
        }
      });

    this.pending = request;
    return request;
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    if (!this.session) {
      throw new ApiError('Vui lòng đăng nhập.', 401);
    }

    const generation = this.generation;
    const send = () => {
      const headers = new Headers(options.headers);
      headers.set('Authorization', 'Bearer ' + this.session!.accessToken);
      return this.transport<T>(path, { ...options, headers });
    };

    try {
      return await send();
    } catch (error) {
      if (generation !== this.generation) {
        throw error;
      }
      if (!(error instanceof ApiError) || error.status !== 401) {
        if (error instanceof ApiError && error.code === 'ACCOUNT_DISABLED') {
          this.clear();
        }
        throw error;
      }

      await this.restore();
      if (generation !== this.generation) {
        throw error;
      }

      try {
        return await send();
      } catch (retryError) {
        if (generation === this.generation && retryError instanceof ApiError && retryError.status === 401) {
          this.clear();
        }
        throw retryError;
      }
    }
  }

  async logout() {
    // Chặn refresh đang chờ khôi phục lại tài khoản sau thao tác đăng xuất.
    const generation = ++this.generation;
    this.pending = null;
    await this.transport('/web-auth/logout', { method: 'POST' });

    // Chỉ báo đăng xuất thành công khi server đã thu hồi cookie.
    if (generation === this.generation) {
      this.update(null);
    }
  }

  async updateProfile(name: string) {
    const generation = this.generation;
    const user = await this.request<Session['user']>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ ho_ten: name.trim() }),
    });

    if (this.session && generation === this.generation) {
      this.update({ ...this.session, user });
    }
  }
}
