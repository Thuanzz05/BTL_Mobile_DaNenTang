import { TrangThaiNhoTu } from '../types/models';

export function nextReviewDate(
  status: TrangThaiNhoTu,
  reviewCount: number,
  now = new Date()
): Date {
  const intervals = [1, 3, 7, 14, 30];
  const days =
    status === 'chua-nho'
      ? 0
      : status === 'chua-chac'
        ? 1
        : intervals[Math.min(Math.max(reviewCount - 1, 0), 4)];
  return new Date(now.getTime() + days * 86400000);
}
