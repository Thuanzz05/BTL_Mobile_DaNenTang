import { useEffect, useRef, useState } from "react";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import * as Speech from "expo-speech";
import { API_URL } from "@/services/api";

export function usePronunciation(word?: string, audioUrl?: string | null) {
  const source = audioUrl ? new URL(audioUrl, API_URL).toString() : null;
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);
  const [error, setError] = useState({ word: "", message: "" });
  const generation = useRef(0);
  const showError = (message: string) =>
    setError({ word: word || "", message });

  useEffect(
    () => () => {
      generation.current++;
      void Speech.stop();
    },
    [word, audioUrl],
  );

  async function pronounce() {
    if (!word) return;
    const request = ++generation.current;
    showError("");
    try {
      await Speech.stop();
      if (request !== generation.current) return;
      if (!source || status.error) {
        Speech.speak(word, {
          language: "en-US",
          rate: 0.82,
          onError: () => showError("Thiết bị chưa phát âm được từ này."),
        });
        return;
      }
      await setAudioModeAsync({ playsInSilentMode: true });
      if (status.isLoaded) await player.seekTo(0);
      if (request === generation.current) player.play();
    } catch {
      if (request !== generation.current) return;
      showError(
        "Chưa phát được file âm thanh. Đang dùng giọng đọc của thiết bị.",
      );
      Speech.speak(word, {
        language: "en-US",
        rate: 0.82,
        onError: () => showError("Thiết bị chưa phát âm được từ này."),
      });
    }
  }

  return {
    pronounce,
    audioMessage:
      (error.word === word ? error.message : "") ||
      (status.error
        ? "Không tải được âm thanh. Bấm Phát âm để dùng giọng đọc của thiết bị."
        : ""),
  };
}
