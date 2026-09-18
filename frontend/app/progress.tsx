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

interface TopicProgress {
  topic_id: string;
  topic_name: string;
  total_words: number;
  learned_words: number;
  mastered_words: number;
}

interface ProgressData {
  tong_so_tu_da_hoc: number;
  da_nho: number;
  chua_chac: number;
  chua_nho: number;
  ty_le: number;
  hom_nay: number;
  tuan_nay: number;
  thang_nay: number;
  chuoi_ngay_hoc: number;
  theo_chu_de: TopicProgress[];
}

export default function ProgressScreen() {
  const { client, ready, user } = useAuth();
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingGoal, setSavingGoal] = useState<5 | 10 | 20 | null>(null);
  const [goalMessage, setGoalMessage] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      setData(await client.authorized<ProgressData>("/progress"));
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
      .authorized<ProgressData>("/progress")
      .then((value) => {
        if (active) setData(value);
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

  const topics = useMemo(
    () =>
      (data?.theo_chu_de ?? [])
        .filter((topic) => Number(topic.total_words) > 0)
        .sort((a, b) => {
          const aProgress = Number(a.learned_words) / Number(a.total_words);
          const bProgress = Number(b.learned_words) / Number(b.total_words);
          return aProgress - bProgress;
        }),
    [data],
  );
  const dailyGoal = user?.muc_tieu_hang_ngay ?? 20;

  async function updateGoal(goal: 5 | 10 | 20) {
    if (savingGoal || goal === dailyGoal) return;
    setSavingGoal(goal);
    setGoalMessage("");
    try {
      await client.updateDailyGoal(goal);
      setGoalMessage(`Đã đặt mục tiêu ${goal} từ mỗi ngày.`);
    } catch (saveError) {
      setGoalMessage((saveError as Error).message);
    } finally {
      setSavingGoal(null);
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
          <Ionicons name="arrow-back" size={24} color={c.ink} />
        </Pressable>
        <View style={s.headerText}>
          <Text style={s.eyebrow}>HÀNH TRÌNH CỦA BẠN</Text>
          <Text style={s.heading}>Thống kê tiến độ</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={c.green}
          />
        }
      >
        {loading && !data ? (
          <ActivityIndicator size="large" color={c.green} />
        ) : error && !data ? (
          <View style={s.message}>
            <Ionicons name="cloud-offline-outline" size={38} color={c.danger} />
            <Text accessibilityRole="alert" style={s.errorText}>
              {error}
            </Text>
            <Pressable
              accessibilityRole="button"
              style={s.retry}
              onPress={load}
            >
              <Text style={s.retryText}>Thử lại</Text>
            </Pressable>
          </View>
        ) : data ? (
          <>
            <View style={s.hero}>
              <View style={s.heroTop}>
                <View>
                  <Text style={s.heroLabel}>TỶ LỆ GHI NHỚ</Text>
                  <Text style={s.heroNumber}>{Number(data.ty_le)}%</Text>
                </View>
                <View style={s.heroIcon}>
                  <Ionicons name="trending-up" size={32} color="white" />
                </View>
              </View>
              <View
                accessibilityRole="progressbar"
                accessibilityValue={{
                  min: 0,
                  max: 100,
                  now: Number(data.ty_le),
                }}
                style={s.heroTrack}
              >
                <View
                  style={[
                    s.heroFill,
                    { width: `${Math.min(100, Number(data.ty_le))}%` },
                  ]}
                />
              </View>
              <View style={s.streakBadge}>
                <Ionicons name="flame" size={21} color="#8A5A2B" />
                <Text style={s.streakText}>
                  {Number(data.chuoi_ngay_hoc)} ngày học liên tiếp
                </Text>
              </View>
              <Text style={s.heroBody}>
                Bạn đã luyện {Number(data.tong_so_tu_da_hoc)} từ. Tiếp tục học
                đều để phần ghi nhớ tăng lên mỗi ngày.
              </Text>
            </View>

            <View style={s.periods}>
              <Period
                icon="sunny-outline"
                value={data.hom_nay}
                label="Hôm nay"
              />
              <Period
                icon="calendar-outline"
                value={data.tuan_nay}
                label="Tuần này"
              />
              <Period
                icon="stats-chart-outline"
                value={data.thang_nay}
                label="Tháng này"
              />
            </View>

            <View style={s.section}>
              <Text style={s.sectionTitle}>Mục tiêu mỗi ngày</Text>
              <View style={s.goalCard}>
                <Text style={s.goalBody}>
                  Chọn số từ phù hợp với thời gian của bạn. Trang chủ sẽ theo
                  dõi tiến độ dựa trên mục tiêu này.
                </Text>
                <View style={s.goalOptions}>
                  {([5, 10, 20] as const).map((goal) => {
                    const selected = goal === dailyGoal;
                    return (
                      <Pressable
                        key={goal}
                        accessibilityRole="button"
                        accessibilityState={{
                          selected,
                          disabled: !!savingGoal,
                        }}
                        disabled={!!savingGoal}
                        style={[s.goalOption, selected && s.goalSelected]}
                        onPress={() => void updateGoal(goal)}
                      >
                        {savingGoal === goal ? (
                          <ActivityIndicator
                            color={selected ? "white" : c.green}
                          />
                        ) : (
                          <>
                            <Text
                              style={[
                                s.goalNumber,
                                selected && s.goalTextSelected,
                              ]}
                            >
                              {goal}
                            </Text>
                            <Text
                              style={[
                                s.goalLabel,
                                selected && s.goalTextSelected,
                              ]}
                            >
                              từ
                            </Text>
                          </>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
                {!!goalMessage && (
                  <Text accessibilityRole="alert" style={s.goalMessage}>
                    {goalMessage}
                  </Text>
                )}
              </View>
            </View>

            <View style={s.section}>
              <Text style={s.sectionTitle}>Mức độ ghi nhớ</Text>
              <View style={s.memoryCard}>
                <MemoryRow
                  color={c.green}
                  label="Vững"
                  value={data.da_nho}
                  total={data.tong_so_tu_da_hoc}
                />
                <MemoryRow
                  color="#D49A45"
                  label="Đang củng cố"
                  value={data.chua_chac}
                  total={data.tong_so_tu_da_hoc}
                />
                <MemoryRow
                  color={c.danger}
                  label="Cần luyện thêm"
                  value={data.chua_nho}
                  total={data.tong_so_tu_da_hoc}
                />
              </View>
            </View>

            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Tiến độ theo chủ đề</Text>
                <Text style={s.sectionCount}>{topics.length} chủ đề</Text>
              </View>
              {topics.length === 0 ? (
                <View style={s.empty}>
                  <Ionicons name="book-outline" size={38} color={c.green} />
                  <Text style={s.emptyTitle}>Chưa có tiến độ</Text>
                  <Text style={s.body}>
                    Học một chủ đề ở trang chủ để xem thống kê tại đây.
                  </Text>
                </View>
              ) : (
                topics.map((topic) => (
                  <TopicRow key={topic.topic_id} topic={topic} />
                ))
              )}
            </View>
          </>
        ) : null}

        {!!error && !!data && (
          <Text accessibilityRole="alert" style={s.errorText}>
            {error}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Period({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
}) {
  return (
    <View style={s.periodCard}>
      <Ionicons name={icon} size={21} color={c.green} />
      <Text style={s.periodNumber}>{Number(value)}</Text>
      <Text style={s.periodLabel}>{label}</Text>
    </View>
  );
}

function MemoryRow({
  color,
  label,
  value,
  total,
}: {
  color: string;
  label: string;
  value: number;
  total: number;
}) {
  const percent = total
    ? Math.min(100, (Number(value) / Number(total)) * 100)
    : 0;
  return (
    <View style={s.memoryRow}>
      <View style={s.memoryHeading}>
        <View style={[s.dot, { backgroundColor: color }]} />
        <Text style={s.memoryLabel}>{label}</Text>
        <Text style={s.memoryValue}>{Number(value)} từ</Text>
      </View>
      <View style={s.track}>
        <View
          style={[s.fill, { width: `${percent}%`, backgroundColor: color }]}
        />
      </View>
    </View>
  );
}

function TopicRow({ topic }: { topic: TopicProgress }) {
  const total = Number(topic.total_words);
  const learned = Number(topic.learned_words);
  const percent = total
    ? Math.min(100, Math.round((learned / total) * 100))
    : 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Xem chủ đề ${topic.topic_name}`}
      style={({ pressed }) => [s.topicCard, pressed && s.pressed]}
      onPress={() =>
        router.push({ pathname: "/topic", params: { topicId: topic.topic_id } })
      }
    >
      <View style={s.topicTop}>
        <View style={s.topicIcon}>
          <Ionicons name="library-outline" size={21} color={c.green} />
        </View>
        <View style={s.topicText}>
          <Text style={s.topicName}>{topic.topic_name}</Text>
          <Text style={s.topicMeta}>
            {learned}/{total} từ đã học
          </Text>
        </View>
        <Text style={s.topicPercent}>{percent}%</Text>
      </View>
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: total, now: learned }}
        style={s.track}
      >
        <View style={[s.fill, { width: `${percent}%` }]} />
      </View>
      <Text style={s.mastered}>
        {Number(topic.mastered_words)} từ đã ghi nhớ vững
      </Text>
    </Pressable>
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
    fontWeight: "800",
    letterSpacing: 1.3,
  },
  heading: { color: c.ink, fontSize: 25, fontWeight: "800" },
  content: {
    padding: 22,
    paddingBottom: 40,
    gap: 22,
    width: "100%",
    maxWidth: 650,
    alignSelf: "center",
  },
  hero: { padding: 24, borderRadius: 26, backgroundColor: c.green, gap: 15 },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroLabel: {
    color: "#CFE5D8",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  heroNumber: { color: "white", fontSize: 48, fontWeight: "800" },
  heroIcon: {
    width: 62,
    height: 62,
    borderRadius: 21,
    backgroundColor: "#397B62",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4B826D",
    overflow: "hidden",
  },
  heroFill: { height: "100%", borderRadius: 5, backgroundColor: "#DCECBA" },
  streakBadge: {
    alignSelf: "flex-start",
    minHeight: 42,
    paddingHorizontal: 13,
    borderRadius: 13,
    backgroundColor: c.peach,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  streakText: { color: "#704719", fontSize: 13, fontWeight: "800" },
  heroBody: { color: "#DFEBE2", fontSize: 14, lineHeight: 22 },
  periods: { flexDirection: "row", gap: 10 },
  periodCard: {
    flex: 1,
    minHeight: 112,
    padding: 14,
    borderRadius: 19,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  periodNumber: { color: c.ink, fontSize: 22, fontWeight: "800" },
  periodLabel: { color: c.muted, fontSize: 11, textAlign: "center" },
  section: { gap: 12 },
  goalCard: {
    padding: 19,
    borderRadius: 21,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    gap: 15,
  },
  goalBody: { color: c.muted, fontSize: 13, lineHeight: 21 },
  goalOptions: { flexDirection: "row", gap: 10 },
  goalOption: {
    flex: 1,
    minHeight: 70,
    borderRadius: 17,
    backgroundColor: c.soft,
    borderWidth: 1,
    borderColor: c.line,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
  },
  goalSelected: { backgroundColor: c.green, borderColor: c.green },
  goalNumber: { color: c.ink, fontSize: 23, fontWeight: "800" },
  goalLabel: { color: c.muted, fontSize: 12 },
  goalTextSelected: { color: "white" },
  goalMessage: { color: c.green, fontSize: 12, fontWeight: "600" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { color: c.ink, fontSize: 20, fontWeight: "700" },
  sectionCount: { color: c.muted, fontSize: 12 },
  memoryCard: {
    padding: 19,
    borderRadius: 21,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    gap: 18,
  },
  memoryRow: { gap: 8 },
  memoryHeading: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  memoryLabel: { flex: 1, color: c.ink, fontSize: 14, fontWeight: "600" },
  memoryValue: { color: c.muted, fontSize: 12 },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: c.soft,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 4, backgroundColor: c.green },
  topicCard: {
    padding: 17,
    borderRadius: 20,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    gap: 12,
  },
  pressed: { opacity: 0.68 },
  topicTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  topicIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: c.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  topicText: { flex: 1, gap: 3 },
  topicName: { color: c.ink, fontSize: 16, fontWeight: "700" },
  topicMeta: { color: c.muted, fontSize: 12 },
  topicPercent: { color: c.green, fontSize: 15, fontWeight: "800" },
  mastered: { color: c.muted, fontSize: 11 },
  message: { paddingVertical: 60, alignItems: "center", gap: 15 },
  errorText: { color: c.danger, lineHeight: 21, textAlign: "center" },
  retry: {
    minHeight: 48,
    paddingHorizontal: 22,
    borderRadius: 14,
    backgroundColor: c.green,
    alignItems: "center",
    justifyContent: "center",
  },
  retryText: { color: "white", fontWeight: "700" },
  empty: {
    padding: 30,
    borderRadius: 21,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: { color: c.ink, fontSize: 19, fontWeight: "700" },
  body: { color: c.muted, fontSize: 14, lineHeight: 22, textAlign: "center" },
});
