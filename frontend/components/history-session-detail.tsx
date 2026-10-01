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
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/contexts/auth-context";
import { useQuizSession } from "@/hooks/use-quiz-session";
import { palette as c } from "@/constants/palette";
import type { SessionDetail, StudySession } from "@/types/history";

const resultLabels: Record<string, string> = {
  "da-xem": "Đã xem flashcard",
  "da-nho": "Đúng ngay từ đầu",
  "chua-chac": "Đã luyện lại sau 1 lần sai",
  "chua-nho": "Đã luyện lại sau nhiều lần sai",
};

export function HistorySessionDetail({
  session,
  onClose,
  onResume,
  onStopped,
}: {
  session: StudySession;
  onClose: () => void;
  onResume: () => void;
  onStopped: () => void;
}) {
  const { client } = useAuth();
  const { client: quizClient } = useQuizSession();
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [confirmStop, setConfirmStop] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    client
      .authorized<SessionDetail>(`/history/${session.id}`)
      .then((data) => {
        if (active) setDetail(data);
      })
      .catch((failure) => {
        if (active) setError((failure as Error).message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt, client, session.id]);

  async function stop() {
    if (!quizClient || busy) return;
    setBusy(true);
    setError("");
    try {
      const restored = await quizClient.open(undefined, {
        id: session.id,
        title: session.topic_name || "Ôn tập tổng hợp",
      });
      // Cùng hàng đợi với quiz: gửi câu đang chờ trước khi dừng.
      if (restored.session.trang_thai === "dang-hoc") await quizClient.stop();
      onStopped();
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const current = detail || session;
  const resumable =
    current.trang_thai === "dang-hoc" &&
    (current.phuong_thuc === "trac_nghiem" ||
      current.phuong_thuc === "flashcard");
  const attempts = detail?.luot_tra_loi || [];
  return (
    <Modal
      visible
      animationType="slide"
      onRequestClose={() => {
        if (!busy) onClose();
      }}
    >
      <SafeAreaView style={s.page}>
        <View style={s.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đóng chi tiết"
            disabled={busy}
            onPress={onClose}
            style={s.close}
          >
            <Feather name="x" size={23} color={c.ink} />
          </Pressable>
          <Text style={s.title}>{session.topic_name || "Ôn tập tổng hợp"}</Text>
        </View>
        <ScrollView contentContainerStyle={s.content}>
          {loading && <ActivityIndicator color={c.green} />}
          {!!error && (
            <View style={s.card}>
              <Text accessibilityRole="alert" style={s.error}>
                {error}
              </Text>
              {!detail && (
                <Pressable
                  onPress={() => {
                    setLoading(true);
                    setError("");
                    setAttempt((v) => v + 1);
                  }}
                >
                  <Text style={s.link}>Thử tải lại</Text>
                </Pressable>
              )}
            </View>
          )}
          {resumable && (
            <View style={s.card}>
              <Text style={s.body}>
                Bài này chưa hoàn thành. Bạn có thể tiếp tục từ tiến độ đã lưu
                trên máy chủ.
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={onResume}
                style={s.button}
              >
                <Text style={s.white}>Tiếp tục bài học</Text>
              </Pressable>
              {current.phuong_thuc === "trac_nghiem" &&
                (confirmStop ? (
                  <>
                    <Text style={s.body}>
                      Dừng phiên này? Các lượt trả lời đã gửi vẫn được giữ trong
                      lịch sử.
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      disabled={busy}
                      onPress={stop}
                      style={s.secondary}
                    >
                      <Text style={s.error}>
                        {busy ? "Đang lưu và dừng…" : "Xác nhận dừng phiên"}
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      disabled={busy}
                      onPress={() => setConfirmStop(false)}
                      style={s.secondary}
                    >
                      <Text style={s.link}>Tiếp tục giữ bài</Text>
                    </Pressable>
                  </>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setConfirmStop(true)}
                    style={s.secondary}
                  >
                    <Text style={s.error}>Dừng phiên</Text>
                  </Pressable>
                ))}
            </View>
          )}
          {attempts.length > 0 && (
            <>
              <Text style={s.title}>Lượt trả lời: {attempts.length}</Text>
              <Text style={s.body}>
                Đúng {attempts.filter((item) => Boolean(item.dung)).length} ·
                Sai {attempts.filter((item) => !item.dung).length}
              </Text>
              {attempts.map((item) => (
                <View key={item.id} style={s.card}>
                  <Text style={s.word}>
                    {item.thu_tu}. {item.tu_tieng_anh}
                  </Text>
                  <Text style={item.dung ? s.link : s.error}>
                    {item.dung ? "Đúng" : "Sai"}
                  </Text>
                  <Text style={s.body}>
                    Bạn chọn:{" "}
                    {item.lua_chon.find(
                      (option) => option.id === item.dap_an_chon_id,
                    )?.noi_dung || "—"}
                  </Text>
                  {!item.dung && (
                    <Text style={s.body}>
                      Đáp án đúng:{" "}
                      {item.lua_chon.find(
                        (option) => option.id === item.dap_an_dung_id,
                      )?.noi_dung || "—"}
                    </Text>
                  )}
                </View>
              ))}
            </>
          )}
          {detail?.results.map((result) => (
            <View key={result.id} style={s.card}>
              <Text style={s.word}>{result.tu_tieng_anh}</Text>
              {!!result.phien_am && (
                <Text style={s.body}>{result.phien_am}</Text>
              )}
              <Text style={s.body}>{result.nghia_tieng_viet}</Text>
              <Text style={s.link}>
                {current.phuong_thuc === "danh_gia"
                  ? {
                      "da-nho": "Đã nhớ",
                      "chua-chac": "Chưa chắc",
                      "chua-nho": "Chưa nhớ",
                    }[result.trang_thai] || result.trang_thai
                  : resultLabels[result.trang_thai] || result.trang_thai}
              </Text>
            </View>
          ))}
          {!loading && detail && !attempts.length && !detail.results.length && (
            <Text style={s.body}>
              Phiên chưa có kết quả hoàn thành. Tiến độ thẻ đã xem được giữ khi
              tiếp tục học.
            </Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: c.background },
  header: { padding: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  close: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 22,
    gap: 12,
    width: "100%",
    maxWidth: 580,
    alignSelf: "center",
  },
  title: { color: c.ink, fontSize: 20, fontWeight: "700", flexShrink: 1 },
  word: { color: c.ink, fontSize: 18, fontWeight: "700" },
  body: { color: c.muted, fontSize: 14, lineHeight: 22 },
  card: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    borderRadius: 10,
    padding: 18,
    gap: 10,
  },
  button: {
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: c.green,
    borderRadius: 8,
  },
  secondary: { minHeight: 44, justifyContent: "center", alignItems: "center" },
  white: { color: "white", fontWeight: "700" },
  link: { color: c.green, fontWeight: "700" },
  error: { color: c.danger, lineHeight: 22 },
});
