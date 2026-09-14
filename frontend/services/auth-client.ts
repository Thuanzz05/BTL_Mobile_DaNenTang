export interface User {
  id: string;
  ho_ten: string;
  email: string;
  anh_dai_dien?: string | null;
  vai_tro: "user" | "admin";
}
export interface Session {
  user: User;
  accessToken: string;
  refreshToken: string;
}
interface TokenStorage {
  read(): Promise<string | null>;
  write(token: string): Promise<void>;
  clear(): Promise<void>;
}
type Request = <T>(path: string, options?: RequestInit) => Promise<T>;
const post = (body: unknown): RequestInit => ({
  method: "POST",
  body: JSON.stringify(body),
});
const statusOf = (e: unknown) => (e as { status?: number })?.status;

/** Transport/storage are injected so authentication can be tested without a device. */
export class AuthClient {
  private session: Session | null = null;
  private generation = 0;
  private refreshing: Promise<string> | null = null;
  constructor(
    private request: Request,
    private storage: TokenStorage,
    private changed: (user: User | null) => void,
  ) {}
  private async clear() {
    this.generation++;
    this.session = null;
    this.changed(null);
    await this.storage.clear();
  }
  async login(email: string, password: string) {
    const result = await this.request<Session>(
      "/auth/login",
      post({ email: email.trim().toLowerCase(), mat_khau: password }),
    );
    await this.storage.write(result.refreshToken);
    this.generation++;
    this.session = result;
    this.changed(result.user);
  }
  async register(name: string, email: string, password: string) {
    // Register returns a user, not tokens. The caller navigates to login after success.
    return this.request<User>(
      "/auth/register",
      post({
        ho_ten: name.trim(),
        email: email.trim().toLowerCase(),
        mat_khau: password,
      }),
    );
  }
  async updateProfile(name: string) {
    const user = await this.authorized<User>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify({ ho_ten: name.trim() }),
    });
    if (this.session) this.session = { ...this.session, user };
    this.changed(user);
    return user;
  }
  async changePassword(currentPassword: string, newPassword: string) {
    await this.authorized("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({
        mat_khau_cu: currentPassword,
        mat_khau_moi: newPassword,
      }),
    });
    await this.clear();
  }
  async restore() {
    const generation = this.generation;
    const refreshToken = await this.storage.read();
    if (!refreshToken) return;
    try {
      const { accessToken } = await this.request<{ accessToken: string }>(
        "/auth/refresh",
        post({ refreshToken }),
      );
      const user = await this.request<User>("/auth/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (generation !== this.generation) return;
      this.session = { user, accessToken, refreshToken };
      this.changed(user);
    } catch (error) {
      if (generation !== this.generation) return;
      if ([401, 403].includes(statusOf(error) || 0)) {
        await this.clear();
        return;
      }
      throw error; // Keep the saved token during temporary network failures.
    }
  }
  private refresh(): Promise<string> {
    if (this.refreshing) return this.refreshing;
    const session = this.session;
    const generation = this.generation;
    this.refreshing = (async () => {
      if (!session) throw new Error("Vui lòng đăng nhập lại.");
      try {
        const data = await this.request<{ accessToken: string }>(
          "/auth/refresh",
          post({ refreshToken: session.refreshToken }),
        );
        if (generation !== this.generation)
          throw new Error("Phiên đăng nhập đã thay đổi.");
        this.session = { ...session, accessToken: data.accessToken };
        return data.accessToken;
      } catch (error) {
        if (
          generation === this.generation &&
          [401, 403].includes(statusOf(error) || 0)
        )
          await this.clear();
        throw error;
      }
    })().finally(() => {
      this.refreshing = null;
    });
    return this.refreshing;
  }
  async authorized<T>(path: string, options: RequestInit = {}): Promise<T> {
    const session = this.session;
    if (!session) throw new Error("Vui lòng đăng nhập để tiếp tục.");
    const generation = this.generation;
    const send = (token: string) =>
      this.request<T>(path, {
        ...options,
        headers: { ...options.headers, Authorization: `Bearer ${token}` },
      });
    try {
      return await send(session.accessToken);
    } catch (error) {
      if (statusOf(error) === 403 && generation === this.generation) {
        await this.clear();
        throw error;
      }
      if (statusOf(error) !== 401 || generation !== this.generation)
        throw error;
      const token =
        this.session?.accessToken !== session.accessToken
          ? this.session!.accessToken
          : await this.refresh();
      try {
        return await send(token);
      } catch (retryError) {
        if (
          generation === this.generation &&
          [401, 403].includes(statusOf(retryError) || 0)
        )
          await this.clear();
        throw retryError;
      }
    }
  }
  async logout() {
    const session = this.session;
    try {
      if (session)
        await this.authorized(
          "/auth/logout",
          post({ refreshToken: session.refreshToken }),
        );
    } finally {
      await this.clear();
    }
  }
}
