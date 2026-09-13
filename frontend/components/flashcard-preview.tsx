import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { palette as c } from "@/constants/palette";
import { getWords, Topic, Word } from "@/services/catalog";
export function FlashcardPreview({
  topic,
  onClose,
}: {
  topic: Topic | null;
  onClose: () => void;
}) {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!topic) return;
    let active = true;
    getWords(topic.id)
      .then((data) => {
        if (active) setWords(data);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [topic, attempt]);
  const word = words[index];
  return (
    <Modal visible={!!topic} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={s.page}>
        <ScrollView contentContainerStyle={s.content}>
          <View style={s.row}>
            <Text style={s.title}>{topic?.ten}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Đóng flashcard"
              onPress={onClose}
              style={s.close}
            >
              <Ionicons name="close" size={26} color={c.ink} />
            </Pressable>
          </View>
          <Text style={s.note}>Học thử · Tiến độ phiên này không được lưu</Text>
          {loading ? (
            <ActivityIndicator size="large" color={c.green} />
          ) : error ? (
            <View style={s.card}>
              <Text style={s.note}>{error}</Text>
              <Pressable
                accessibilityRole="button"
                style={s.button}
                onPress={() => {
                  setLoading(true);
                  setError("");
                  setAttempt((v) => v + 1);
                }}
              >
                <Text style={s.white}>Thử lại</Text>
              </Pressable>
            </View>
          ) : word ? (
            <>
              <Text style={s.counter}>
                THẺ {index + 1} / {words.length}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Lật thẻ để xem nghĩa"
                style={s.card}
                onPress={() => setFlipped((v) => !v)}
              >
                <Ionicons name="layers-outline" size={36} color={c.green} />
                <Text style={s.word}>
                  {flipped ? word.nghia_tieng_viet : word.tu_tieng_anh}
                </Text>
                <Text style={s.note}>
                  {flipped ? word.tu_tieng_anh : word.phien_am}
                </Text>
                <Text style={s.hint}>
                  Chạm để {flipped ? "xem từ tiếng Anh" : "lật thẻ"}
                </Text>
              </Pressable>
              <View style={s.row}>
                <Pressable
                  accessibilityRole="button"
                  disabled={index === 0}
                  style={[s.secondary, index === 0 && s.disabled]}
                  onPress={() => {
                    setIndex((v) => v - 1);
                    setFlipped(false);
                  }}
                >
                  <Text style={s.note}>Thẻ trước</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  style={s.button}
                  onPress={() => {
                    setIndex((v) => v + 1);
                    setFlipped(false);
                  }}
                >
                  <Text style={s.white}>
                    {index === words.length - 1
                      ? "Hoàn thành"
                      : "Thẻ tiếp theo"}
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <View style={s.card}>
              <Ionicons
                name={
                  words.length
                    ? "checkmark-circle-outline"
                    : "file-tray-outline"
                }
                size={52}
                color={c.green}
              />
              <Text style={s.title}>
                {words.length
                  ? "Bạn đã xem hết các thẻ!"
                  : "Chủ đề đang được cập nhật"}
              </Text>
              <Text style={s.note}>
                {words.length
                  ? "Mỗi từ mới là một bước tiến nhỏ."
                  : "Hãy chọn một chủ đề khác để bắt đầu."}
              </Text>
              <Pressable
                accessibilityRole="button"
                style={s.button}
                onPress={onClose}
              >
                <Text style={s.white}>Về trang chủ</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: c.background },
  content: {
    padding: 24,
    gap: 24,
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: { fontSize: 22, fontWeight: "700", color: c.ink, flexShrink: 1 },
  close: { padding: 10 },
  note: { color: c.muted, fontSize: 15, lineHeight: 23 },
  counter: {
    color: c.green,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
    textAlign: "center",
  },
  card: {
    minHeight: 330,
    padding: 28,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    gap: 22,
  },
  word: { fontSize: 34, color: c.ink, fontWeight: "700", textAlign: "center" },
  hint: { color: c.muted, fontSize: 13 },
  button: {
    backgroundColor: c.green,
    borderRadius: 16,
    padding: 17,
    alignItems: "center",
  },
  white: { color: "white", fontWeight: "700", fontSize: 15 },
  secondary: { padding: 17 },
  disabled: { opacity: 0.35 },
});
