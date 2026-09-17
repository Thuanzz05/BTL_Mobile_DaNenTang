import * as SecureStore from "expo-secure-store";
import type { QuizStorage } from "./quiz-session";

// Chỉ lưu ID và một câu trả lời chờ gửi, không lưu cả bộ câu hỏi.
export const quizStorage: QuizStorage = {
  read: (key) => SecureStore.getItemAsync(key),
  write: (key, value) => SecureStore.setItemAsync(key, value),
  remove: (key) => SecureStore.deleteItemAsync(key),
};
