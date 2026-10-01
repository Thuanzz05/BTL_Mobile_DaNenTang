import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { palette as c } from "@/constants/palette";
import { useAuth } from "@/contexts/auth-context";
import { useStudyHistory } from "@/hooks/use-study-history";
import { HistorySessionDetail } from "@/components/history-session-detail";
import { FlashcardPreview } from "@/components/flashcard-preview";
import type { StudySession } from "@/types/history";
import type { QuizResume } from "@/types/quiz";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
});

function sessionStatus(status: StudySession["trang_thai"]) {
  if (status === "hoan-thanh") return "Hoàn thành";
  if (status === "dang-hoc") return "Đang học";
  return "Đã dừng";
}

export default function HistoryScreen() {
  const { ready, user } = useAuth();
  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user]);

  if (!ready || !user) {
    return (
      <SafeAreaView style={s.page}>
        <ActivityIndicator color={c.green} />
      </SafeAreaView>
    );
  }
  return <HistoryContent key={user.id} />;
}

function HistoryContent() {
  const history = useStudyHistory();
  const [selected, setSelected] = useState<StudySession | null>(null);
  const [quiz, setQuiz] = useState<QuizResume>();
  const wordCount = useMemo(
    () =>
      history.sessions.reduce(
        (sum, session) => sum + Number(session.total_results),
        0,
      ),
    [history.sessions],
  );

  function resumeSession() {
    if (!selected) return;
    setSelected(null);
    if (selected.phuong_thuc === "flashcard" && selected.chu_de_id) {
      router.push({
        pathname: "/study",
        params: {
          topicId: selected.chu_de_id,
          topicName: selected.topic_name || "Từ vựng",
        },
      });
    } else {
      setQuiz({
        id: selected.id,
        title: selected.topic_name || "Ôn tập tổng hợp",
      });
    }
  }

  return (
    <SafeAreaView style={s.page}>
      <View style={s.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          style={s.back}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={23} color={c.ink} />
        </Pressable>
        <View style={s.headerText}>
          <Text style={s.eyebrow}>Hành trình của bạn</Text>
          <Text style={s.heading}>Lịch sử học tập</Text>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl
            refreshing={history.loading}
            onRefresh={history.reload}
            tintColor={c.green}
          />
        }
      >
        <View style={s.summary}>
          <View style={s.summaryItem}>
            <Text style={s.summaryNumber}>{history.total}</Text>
            <Text style={s.summaryLabel}>buổi học</Text>
          </View>
          <View style={s.divider} />
          <View style={s.summaryItem}>
            <Text style={s.summaryNumber}>{wordCount}</Text>
            <Text style={s.summaryLabel}>lượt từ đang hiển thị</Text>
          </View>
        </View>
        {!!history.error && (
          <View style={s.message}>
            <Text accessibilityRole="alert" style={s.error}>
              {history.error}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={history.reload}
              style={s.retry}
            >
              <Text style={s.link}>Tải lại lịch sử</Text>
            </Pressable>
          </View>
        )}
        {history.loading && !history.sessions.length ? (
          <ActivityIndicator size="large" color={c.green} />
        ) : !history.sessions.length && !history.error ? (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Feather name="clock" size={34} color={c.green} />
            </View>
            <Text style={s.emptyTitle}>Chưa có buổi học nào</Text>
            <Text style={s.body}>
              Bắt đầu học để ghi lại hành trình của bạn tại đây.
            </Text>
            <Pressable
              accessibilityRole="button"
              style={s.button}
              onPress={() => router.dismissTo("/")}
            >
              <Text style={s.white}>Bắt đầu học</Text>
            </Pressable>
          </View>
        ) : (
          history.sessions.map((session) => {
            const completed = Number(session.total_results);
            const goal = Number(session.tong_so_tu);
            return (
              <Pressable
                key={session.id}
                accessibilityRole="button"
                accessibilityLabel={
                  "Xem chi tiết " + (session.topic_name || "buổi ôn tập")
                }
                style={s.card}
                onPress={() => setSelected(session)}
              >
                <View style={s.cardTop}>
                  <View style={s.sessionIcon}>
                    <Feather
                      name={
                        session.phuong_thuc === "trac_nghiem"
                          ? "refresh-cw"
                          : "book-open"
                      }
                      size={22}
                      color={c.green}
                    />
                  </View>
                  <View style={s.cardTitle}>
                    <Text style={s.topic}>
                      {session.topic_name || "Ôn tập tổng hợp"}
                    </Text>
                    <Text style={s.date}>
                      {dateFormatter.format(new Date(session.bat_dau_luc))}
                    </Text>
                  </View>
                  <View
                    style={[
                      s.badge,
                      session.trang_thai === "hoan-thanh" && s.badgeDone,
                    ]}
                  >
                    <Text style={s.badgeText}>
                      {sessionStatus(session.trang_thai)}
                    </Text>
                  </View>
                </View>
                <View style={s.progressRow}>
                  <Text style={s.progressLabel}>Từ có kết quả</Text>
                  <Text style={s.progressValue}>
                    {completed}/{goal} từ
                  </Text>
                </View>
                <View style={s.progressTrack}>
                  <View
                    style={[
                      s.progressFill,
                      {
                        width: `${goal ? Math.min(100, (completed / goal) * 100) : 0}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={s.detailLink}>
                  {session.trang_thai === "dang-hoc"
                    ? "Xem chi tiết và tiếp tục"
                    : "Xem chi tiết"}
                </Text>
              </Pressable>
            );
          })
        )}
        {!!history.sessions.length && (
          <Text style={s.body}>
            Đang hiển thị {history.sessions.length}/{history.total} phiên
          </Text>
        )}
        {history.hasMore && (
          <Pressable
            accessibilityRole="button"
            disabled={history.loading || history.loadingMore}
            onPress={history.loadMore}
            style={s.button}
          >
            <Text style={s.white}>
              {history.loadingMore ? "Đang tải…" : "Tải thêm lịch sử"}
            </Text>
          </Pressable>
        )}
      </ScrollView>
      {selected && (
        <HistorySessionDetail
          key={selected.id}
          session={selected}
          onClose={() => setSelected(null)}
          onResume={resumeSession}
          onStopped={() => {
            setSelected(null);
            void history.reload();
          }}
        />
      )}
      {quiz && (
        <FlashcardPreview
          topic={null}
          savedSession={quiz}
          onClose={() => {
            setQuiz(undefined);
            void history.reload();
          }}
          onCompleted={() => {
            void history.reload();
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: c.background },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1, gap: 3 },
  eyebrow: {
    color: c.green,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  heading: { color: c.ink, fontSize: 25, fontWeight: "800" },
  content: {
    padding: 22,
    gap: 12,
    width: "100%",
    maxWidth: 580,
    alignSelf: "center",
    paddingBottom: 36,
  },
  summary: {
    padding: 20,
    borderRadius: 10,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    borderLeftWidth: 5,
    borderLeftColor: c.green,
    flexDirection: "row",
    alignItems: "center",
  },
  summaryItem: { flex: 1, alignItems: "center", gap: 4 },
  summaryNumber: { color: c.ink, fontSize: 26, fontWeight: "800" },
  summaryLabel: { color: c.muted, fontSize: 13 },
  divider: { width: 1, height: 42, backgroundColor: c.line },
  card: {
    padding: 18,
    borderRadius: 10,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    gap: 16,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  sessionIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: c.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { flex: 1, gap: 4 },
  topic: { color: c.ink, fontSize: 16, fontWeight: "700" },
  date: { color: c.muted, fontSize: 12 },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: c.peach,
  },
  badgeDone: { backgroundColor: c.soft },
  badgeText: { color: c.ink, fontSize: 10, fontWeight: "700" },
  progressRow: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { color: c.muted, fontSize: 13 },
  progressValue: { color: c.ink, fontSize: 13, fontWeight: "700" },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: c.line,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 4, backgroundColor: c.green },
  detailLink: { color: c.green, fontSize: 13, fontWeight: "700" },
  empty: { paddingVertical: 54, alignItems: "center", gap: 16 },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 10,
    backgroundColor: c.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { color: c.ink, fontSize: 22, fontWeight: "700" },
  body: { color: c.muted, fontSize: 14, lineHeight: 22, textAlign: "center" },
  button: {
    minHeight: 52,
    paddingHorizontal: 22,
    borderRadius: 8,
    backgroundColor: c.green,
    alignItems: "center",
    justifyContent: "center",
  },
  white: { color: "white", fontSize: 15, fontWeight: "700" },
  message: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#FCECE8",
    gap: 8,
  },
  error: { color: c.danger, lineHeight: 21 },
  retry: { minHeight: 44, justifyContent: "center" },
  link: { color: c.green, fontWeight: "700" },
});
