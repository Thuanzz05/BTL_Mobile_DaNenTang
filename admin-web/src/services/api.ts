import { AdminSession, ApiError } from './admin-session';

export const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

async function transport<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('X-Wordleaf-Client', 'admin-web');

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(API_URL + path, {
      ...options,
      headers,
      credentials: 'include',
      signal: options.signal || AbortSignal.timeout(15000),
    });
  } catch {
    throw new ApiError('Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.', 0);
  }

  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success) {
    throw new ApiError(
      result?.message || 'Máy chủ chưa thể xử lý yêu cầu.',
      response.status,
      result?.error?.code || ''
    );
  }

  return result.data as T;
}

export const session = new AdminSession(transport);
export const api = <T>(path: string, options?: RequestInit) => session.request<T>(path, options);
export const jsonBody = (method: string, body: unknown): RequestInit => ({
  method,
  body: JSON.stringify(body),
});

export function mediaUrl(value?: string | null): string | undefined {
  if (!value) {
    return undefined;
  }
  if (/^https?:\/\//.test(value)) {
    return value;
  }
  if (!value.startsWith('/') || value.startsWith('//')) {
    return undefined;
  }

  return new URL(value, new URL(API_URL, window.location.origin)).href;
}
