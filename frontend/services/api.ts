import { Platform } from "react-native";
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === "android"
    ? "http://10.0.2.2:5000/api"
    : "http://localhost:5000/api")
).replace(/\/$/, "");
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success)
      throw new ApiError(
        result?.message || "Máy chủ chưa thể xử lý yêu cầu.",
        response.status,
        result?.error?.code,
      );
    return result.data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      "Không kết nối được máy chủ. Kiểm tra mạng và địa chỉ API.",
      0,
    );
  } finally {
    clearTimeout(timer);
  }
}
