import { TrangThaiTienDo } from '../types/models';

export type LeitnerBox = 1 | 2 | 3 | 4 | 5;

export const LEITNER_INTERVAL_DAYS: Record<LeitnerBox, number> = {
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30,
};

export function normalizeLeitnerBox(value: unknown): LeitnerBox {
  const box = Math.trunc(Number(value));
  return Math.min(5, Math.max(1, Number.isFinite(box) ? box : 1)) as LeitnerBox;
}

export function nextLeitnerBox(current: unknown, correct: boolean): LeitnerBox {
  return correct ? normalizeLeitnerBox(normalizeLeitnerBox(current) + 1) : 1;
}

export function leitnerStatus(box: unknown): TrangThaiTienDo {
  const normalized = normalizeLeitnerBox(box);
  if (normalized === 1) {
    return 'chua-nho';
  }
  if (normalized === 5) {
    return 'thuoc-long';
  }
  return 'da-nho';
}

export function nextReviewDate(box: unknown, now = new Date()): Date {
  const days = LEITNER_INTERVAL_DAYS[normalizeLeitnerBox(box)];
  return new Date(now.getTime() + days * 86400000);
}
