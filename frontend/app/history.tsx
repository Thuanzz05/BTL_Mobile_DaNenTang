import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { palette as c } from "@/constants/palette";
import { useAuth } from "@/contexts/auth-context";

interface StudySession {
  id: string;
  topic_name: string | null;
  tong_so_tu: number;
  bat_dau_luc: string;
  trang_thai: "dang-hoc" | "hoan-thanh" | "bo-do";
  loai_phien?: "hoc_moi" | "on_tap";
  total_results: number;
}

interface HistoryResponse {
  items: StudySession[];
  pagination: { total: number };
}

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function sessionStatus(status: StudySession["trang_thai"]) {
  if (status === "hoan-thanh") return "Hoàn thành";
  if (status === "dang-hoc") return "Đang học";
  return "Đã dừng";
}

export default function HistoryScreen() {
  const { client, ready, user } = useAuth();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const result = await client.authorized<HistoryResponse>(
        "/history?page=1&limit=50",
      );
      setSessions(result.items);
      setTotal(result.pagination.total);
    } catch (loadError) {
      setError((loadError as Error).message);
    } finally {
      setLoading(false);
    }
  }, [client, user]);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    let active = true;
    client
      .authorized<HistoryResponse>("/history?page=1&limit=50")
      .then((result) => {
        if (!active) return;
        setSessions(result.items);
        setTotal(result.pagination.total);
      })
      .catch((loadError) => {
        if (active) setError((loadError as Error).message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [client, ready, user]);

  const wordCount = useMemo(
    () =>
      sessions.reduce((sum, session) => sum + Number(session.total_results), 0),
    [sessions],
  );

  return (
    <SafeAreaView style={s.page}>
      <View style={s.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          style={s.back}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={c.ink} />
        </Pressable>
        <View style={s.headerText}>
          <Text style={s.eyebrow}>HÀNH TRÌNH CỦA BẠN</Text>
          <Text style={s.heading}>Lịch sử học tập</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={c.green}
          />
        }
      >
        <View style={s.summary}>
          <View style={s.summaryItem}>
            <Text style={s.summaryNumber}>{total}</Text>
            <Text style={s.summaryLabel}>buổi học</Text>
          </View>
          <View style={s.divider} />
          <View style={s.summaryItem}>
            <Text style={s.summaryNumber}>{wordCount}</Text>
            <Text style={s.summaryLabel}>lượt luyện từ</Text>
          </View>
        </View>

        {!!error && (
          <View style={s.message}>
            <Text accessibilityRole="alert" style={s.error}>
              {error}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={load}
              style={s.retry}
            >
              <Text style={s.link}>Thử lại</Text>
            </Pressable>
          </View>
        )}

        {loading && sessions.length === 0 ? (
          <ActivityIndicator size="large" color={c.green} />
        ) : sessions.length === 0 && !error ? (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="time-outline" size={38} color={c.green} />
            </View>
            <Text style={s.emptyTitle}>Chưa có buổi học nào</Text>
            <Text style={s.body}>
              Hoàn thành một buổi luyện tập để hành trình của bạn xuất hiện tại
              đây.
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
          sessions.map((session) => {
            const completed = Number(session.total_results);
            const goal = Number(session.tong_so_tu);
            const status = sessionStatus(session.trang_thai);
            return (
              <View key={session.id} style={s.card}>
                <View style={s.cardTop}>
                  <View style={s.sessionIcon}>
                    <Ionicons
                      name={
                        session.loai_phien === "on_tap"
                          ? "refresh"
                          : "book-outline"
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
                    <Text style={s.badgeText}>{status}</Text>
                  </View>
                </View>
                <View style={s.progressRow}>
                  <Text style={s.progressLabel}>Đã luyện</Text>
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
              </View>
            );
          })
        )}
      </ScrollView>
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
    letterSpacing: 1.3,
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
    borderRadius: 22,
    backgroundColor: c.green,
    flexDirection: "row",
    alignItems: "center",
  },
  summaryItem: { flex: 1, alignItems: "center", gap: 4 },
  summaryNumber: { color: "white", fontSize: 26, fontWeight: "800" },
  summaryLabel: { color: "#DCECE4", fontSize: 13 },
  divider: { width: 1, height: 42, backgroundColor: "#4F866F" },
  card: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    gap: 16,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  sessionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
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
  empty: { paddingVertical: 54, alignItems: "center", gap: 16 },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 25,
    backgroundColor: c.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { color: c.ink, fontSize: 22, fontWeight: "700" },
  body: { color: c.muted, fontSize: 14, lineHeight: 22, textAlign: "center" },
  button: {
    minHeight: 52,
    paddingHorizontal: 22,
    borderRadius: 15,
    backgroundColor: c.green,
    alignItems: "center",
    justifyContent: "center",
  },
  white: { color: "white", fontSize: 15, fontWeight: "700" },
  message: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FCECE8",
    gap: 8,
  },
  error: { color: c.danger, lineHeight: 21 },
  retry: { minHeight: 44, justifyContent: "center" },
  link: { color: c.green, fontWeight: "700" },
});
