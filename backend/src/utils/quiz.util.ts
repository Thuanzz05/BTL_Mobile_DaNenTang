import { randomInt } from 'crypto';

export const QUIZ_VERSION = 'leitner-adaptive-v1';

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
  answers: { tu_vung_id: string; dung: number | boolean }[]
) {
  const items: QuizWordState[] = wordIds.map((id) => ({
    id,
    mistakes: 0,
    streak: 0,
    due: 0,
    done: false,
  }));

  answers.forEach((answer, turn) => {
    const item = items.find((word) => word.id === answer.tu_vung_id)!;
    const correct = Boolean(answer.dung);

    item.mistakes += correct ? 0 : 1;
    item.streak = correct ? item.streak + 1 : 0;
    item.due = turn + (correct ? 5 : 3);
    item.done = item.streak >= 2 + Math.min(item.mistakes, 2);
  });

  const remaining = items.filter((item) => !item.done);
  const lastWordId = answers.at(-1)?.tu_vung_id;
  const alternatives = remaining.filter((item) => item.id !== lastWordId);
  const candidates = alternatives.length ? alternatives : remaining;
  const ready = candidates.filter((item) => item.due <= answers.length);

  const next = ready.length
    ? ready.sort((a, b) => b.mistakes - a.mistakes || a.due - b.due)[0]
    : candidates.sort((a, b) => a.due - b.due)[0];

  return {
    items,
    next,
    turn: answers.length,
    correct: answers.filter((answer) => answer.dung).length,
  };
}
