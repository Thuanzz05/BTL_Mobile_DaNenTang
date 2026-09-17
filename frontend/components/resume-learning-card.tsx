import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/auth-context";
import { useQuizSession } from "@/hooks/use-quiz-session";
import { palette as c } from "@/constants/palette";
import { FlashcardPreview } from "./flashcard-preview";

export function ResumeLearningCard({ onUpdated }: { onUpdated: () => void }) {
  const { user, ready, error: authError, retry: retryAuth } = useAuth();
  const { draft, error, retry } = useQuizSession();
  const [open, setOpen] = useState(false);
  if (!ready) return null;
  if (!user && authError)
    return (
      <View style={s.card}>
        <Text style={s.title}>Kết nối lại tài khoản</Text>
        <Text style={s.body}>
          Chưa thể mở bài đã lưu. Tiến trình trên máy vẫn được giữ.
        </Text>
        <Pressable
          accessibilityRole="button"
          style={s.button}
          onPress={retryAuth}
        >
          <Text style={s.link}>Thử kết nối lại</Text>
        </Pressable>
      </View>
    );
  if (!user || (!draft && !error && !open)) return null;
  return (
    <>
      {(draft || error) && (
        <View style={s.card}>
          <Ionicons name="bookmark-outline" size={24} color={c.green} />
          <Text style={s.title}>{draft?.start.title || "Bài học đã lưu"}</Text>
          <Text style={s.body}>
            {error ||
              (draft?.stopping
                ? "Có yêu cầu dừng đang chờ gửi."
                : draft?.pending
                  ? "Bài đang học có một câu trả lời chờ gửi."
                  : "Bạn có một bài học chưa hoàn thành.")}
          </Text>
          <Pressable
            accessibilityRole="button"
            style={s.button}
            onPress={() => (error ? retry() : setOpen(true))}
          >
            <Text style={s.link}>
              {error
                ? "Đọc lại bản lưu"
                : draft?.stopping
                  ? "Kết nối để dừng phiên"
                  : "Tiếp tục bài học"}
            </Text>
          </Pressable>
        </View>
      )}
      {open && (
        <FlashcardPreview
          key={user.id}
          topic={null}
          resume
          onClose={() => {
            setOpen(false);
            onUpdated();
          }}
          onCompleted={onUpdated}
        />
      )}
    </>
  );
}

const s = StyleSheet.create({
  card: { padding: 20, gap: 10, borderRadius: 20, backgroundColor: c.soft },
  title: { fontSize: 18, fontWeight: "700", color: c.ink },
  body: { fontSize: 14, lineHeight: 22, color: c.muted },
  button: { minHeight: 44, justifyContent: "center" },
  link: { fontSize: 15, fontWeight: "700", color: c.green },
});
