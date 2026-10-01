import { useEffect, useRef, useState } from "react";
import * as Speech from "expo-speech";

export function usePronunciation(word?: string) {
  const [error, setError] = useState({ word: "", message: "" });
  const generation = useRef(0);
  const showError = (message: string) =>
    setError({ word: word || "", message });

  useEffect(
    () => () => {
      generation.current++;
      void Speech.stop();
    },
    [word],
  );

  async function pronounce() {
    if (!word) return;
    const request = ++generation.current;
    showError("");
    try {
      await Speech.stop();
      if (request !== generation.current) return;
      Speech.speak(word, {
        language: "en-US",
        rate: 0.82,
        onError: () => {
          if (request === generation.current) {
            showError("Thiết bị chưa phát âm được từ này.");
          }
        },
      });
    } catch {
      if (request !== generation.current) return;
      showError("Thiết bị chưa phát âm được từ này.");
    }
  }

  return {
    pronounce,
    audioMessage: error.word === word ? error.message : "",
  };
}
