import { randomInt } from 'crypto';

export const QUIZ_VERSION = 'leitner-queue-v2';
export const TYPED_QUESTION_RATE = 0.2;

export function typedQuestionIds(wordIds: string[]) {
  const count = Math.ceil(wordIds.length * TYPED_QUESTION_RATE);
  return new Set(shuffled(wordIds).slice(0, count));
}

export function normalizeTypedAnswer(value: string) {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US');
}

export interface QuizWordState {
  id: string;
  mistakes: number;
  streak: number;
  due: number;
  done: boolean;
}

/** Xáo trộn trên bản sao, không làm thay đổi dữ liệu đầu vào. */
export function shuffled<T>(values: T[]): T[] {
  const result = [...values];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = randomInt(index + 1);
    [result[index], result[target]] = [result[target], result[index]];
  }

  return result;
}

/** Tái dựng tiến độ từ những lượt trả lời đã được server chấm. */
export function quizState(
  wordIds: string[],
  answers: { tu_vung_id: string; dung: number | boolean }[],
  version = QUIZ_VERSION
) {
  const items: QuizWordState[] = wordIds.map((id, index) => ({
    id,
    mistakes: 0,
    streak: 0,
    due: index,
    done: false,
  }));

  // Các phiên v1 đang học tiếp tục dùng quy tắc cũ đã lưu cùng phiên.
  const legacy = version === 'adaptive-v1' || version === 'leitner-adaptive-v1';
  if (legacy) {
    items.forEach((item) => {
      item.due = 0;
    });
  }
  answers.forEach((answer, turn) => {
    const item = items.find((word) => word.id === answer.tu_vung_id)!;
    const correct = Boolean(answer.dung);

    item.mistakes += correct ? 0 : 1;
    item.streak = correct ? item.streak + 1 : 0;
    item.due = legacy ? turn + (correct ? 5 : 3) : wordIds.length + turn;
    item.done = legacy ? item.streak >= 2 + Math.min(item.mistakes, 2) : correct;
  });

  const remaining = items.filter((item) => !item.done);
  const lastWordId = answers.at(-1)?.tu_vung_id;
  const alternatives = remaining.filter((item) => item.id !== lastWordId);
  const candidates = alternatives.length ? alternatives : remaining;
  const ready = candidates.filter((item) => item.due <= answers.length);

  const next = !legacy
    ? remaining.sort((a, b) => a.due - b.due)[0]
    : ready.length
      ? ready.sort((a, b) => b.mistakes - a.mistakes || a.due - b.due)[0]
      : candidates.sort((a, b) => a.due - b.due)[0];

  return {
    items,
    next,
    turn: answers.length,
    correct: answers.filter((answer) => answer.dung).length,
  };
}
