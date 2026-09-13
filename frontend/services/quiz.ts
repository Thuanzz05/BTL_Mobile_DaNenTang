import type { Word } from "./catalog";
export interface QuizItem {
  word: Word;
  mistakes: number;
  streak: number;
  due: number;
  done: boolean;
}
export interface QuizState {
  items: QuizItem[];
  current: number;
  turn: number;
  correct: number;
}
export function createQuiz(words: Word[]): QuizState {
  return {
    items: words.map((word) => ({
      word,
      mistakes: 0,
      streak: 0,
      due: 0,
      done: false,
    })),
    current: 0,
    turn: 0,
    correct: 0,
  };
}
export function answerQuiz(state: QuizState, correct: boolean): QuizState {
  const items = state.items.map((item) => ({ ...item }));
  const item = items[state.current];
  item.mistakes += correct ? 0 : 1;
  item.streak = correct ? item.streak + 1 : 0;
  // Harder words require 3–4 consecutive correct answers, easy words require 2.
  item.done = item.streak >= 2 + Math.min(item.mistakes, 2);
  item.due = state.turn + (correct ? 5 : 3);
  return {
    ...state,
    items,
    turn: state.turn + 1,
    correct: state.correct + Number(correct),
  };
}
export function nextQuestion(state: QuizState): QuizState {
  const remaining = state.items
    .map((item, index) => ({ ...item, index }))
    .filter((item) => !item.done);
  const alternatives = remaining.filter((item) => item.index !== state.current);
  const candidates = alternatives.length ? alternatives : remaining;
  candidates.sort((a, b) => {
    const aReady = a.due <= state.turn,
      bReady = b.due <= state.turn;
    if (aReady !== bReady) return aReady ? -1 : 1;
    return aReady
      ? b.mistakes - a.mistakes || a.due - b.due || a.index - b.index
      : a.due - b.due || a.index - b.index;
  });
  return { ...state, current: candidates[0]?.index ?? -1 };
}
export function choicesFor(
  word: Word,
  words: Word[],
  random = Math.random,
): string[] {
  const correct = word.nghia_tieng_viet.trim();
  const distractors = [
    ...new Set(words.map((w) => w.nghia_tieng_viet.trim())),
  ].filter((meaning) => meaning && meaning !== correct);
  const shuffle = (values: string[]) => {
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }
    return values;
  };
  return shuffle([correct, ...shuffle(distractors).slice(0, 3)]);
}
