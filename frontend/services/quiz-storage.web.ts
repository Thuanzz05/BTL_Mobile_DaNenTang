import type { QuizStorage } from "./quiz-session";

export const quizStorage: QuizStorage = {
  read: async (key) =>
    typeof window === "undefined" ? null : window.localStorage.getItem(key),
  write: async (key, value) => {
    window.localStorage.setItem(key, value);
  },
  remove: async (key) => {
    window.localStorage.removeItem(key);
  },
};
