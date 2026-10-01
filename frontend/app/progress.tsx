import { useCallback, useMemo, useState } from "react";
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
import { router, useFocusEffect } from "expo-router";
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
  moi_hoc: number;
  dang_cung_co: number;
  da_thuoc: number;
  den_han: number;
  hoat_dong_30_ngay: { ngay: string; so_tu: number }[];
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
  const [period, setPeriod] = useState<1 | 7 | 30>(7);
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

  useFocusEffect(
    useCallback(() => {
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
    }, [client, ready, user]),
  );

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
          <Feather name="arrow-left" size={23} color={c.ink} />
        </Pressable>
        <View style={s.headerText}>
          <Text style={s.eyebrow}>Hành trình của bạn</Text>
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
            <Feather name="wifi-off" size={34} color={c.danger} />
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
                  <Text style={s.heroLabel}>Tỷ lệ từ đạt ngăn 5</Text>
                  <Text style={s.heroNumber}>{Number(data.ty_le)}%</Text>
                </View>
                <Text style={s.heroMark}>TỔNG QUAN</Text>
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
                <Feather name="zap" size={20} color={c.rust} />
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
              <Period value={data.hom_nay} label="Hôm nay" />
              <Period value={data.tuan_nay} label="Tuần này" />
              <Period value={data.thang_nay} label="Tháng này" />
            </View>

            <View style={s.section}>
              <Text style={s.sectionTitle}>Hoạt động học tập</Text>
              <Text style={s.goalBody}>
                {data.den_han} từ đến hạn ôn. Mỗi từ được tính một lần trong
                ngày.
              </Text>
              <View style={s.goalOptions}>
                {([1, 7, 30] as const).map((value) => (
                  <Pressable
                    key={value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: period === value }}
                    style={[s.goalOption, period === value && s.goalSelected]}
                    onPress={() => setPeriod(value)}
                  >
                    <Text
                      style={[
                        s.goalLabel,
                        period === value && s.goalTextSelected,
                      ]}
                    >
                      {value === 1 ? "Hôm nay" : value + " ngày"}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-end",
                  height: 140,
                  gap: 3,
                  paddingTop: 20,
                }}
              >
                {data.hoat_dong_30_ngay.slice(-period).map((day) => (
                  <View
                    key={day.ngay}
                    accessible
                    accessibilityLabel={day.ngay + ": " + day.so_tu + " từ"}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "flex-end",
                      height: "100%",
                    }}
                  >
                    <Text style={s.goalLabel}>
                      {period <= 7 ? day.so_tu : ""}
                    </Text>
                    <View
                      style={{
                        width: "100%",
                        maxWidth: 60,
                        backgroundColor: c.green,
                        borderRadius: 4,
                        height: Math.max(
                          2,
                          (day.so_tu /
                            Math.max(
                              1,
                              ...data.hoat_dong_30_ngay
                                .slice(-period)
                                .map((d) => d.so_tu),
                            )) *
                            90,
                        ),
                      }}
                    />
                    {period <= 7 && (
                      <Text style={s.goalLabel}>{day.ngay.slice(8)}</Text>
                    )}
                  </View>
                ))}
              </View>
              <Text style={s.goalBody}>
                Ngày trong tháng ·{" "}
                {data.hoat_dong_30_ngay.slice(-period)[0]?.ngay} đến{" "}
                {data.hoat_dong_30_ngay.at(-1)?.ngay}
              </Text>
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
                  label="Đã thuộc · Ngăn 5"
                  value={data.da_thuoc}
                  total={data.tong_so_tu_da_hoc}
                />
                <MemoryRow
                  color="#D49A45"
                  label="Đang củng cố · Ngăn 3–4"
                  value={data.dang_cung_co}
                  total={data.tong_so_tu_da_hoc}
                />
                <MemoryRow
                  color={c.danger}
                  label="Mới học · Ngăn 1–2"
                  value={data.moi_hoc}
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
                  <Feather name="book-open" size={34} color={c.green} />
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

function Period({ value, label }: { value: number; label: string }) {
  return (
    <View style={s.periodCard}>
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
    letterSpacing: 0.2,
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
  hero: {
    padding: 24,
    borderRadius: 10,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    borderLeftWidth: 5,
    borderLeftColor: c.green,
    gap: 15,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroLabel: {
    color: c.green,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  heroNumber: { color: c.ink, fontSize: 48, fontWeight: "800" },
  heroMark: { color: c.rust, fontSize: 10, fontWeight: "800" },
  heroTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: c.soft,
    overflow: "hidden",
  },
  heroFill: { height: "100%", borderRadius: 5, backgroundColor: c.green },
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
  streakText: { color: c.rust, fontSize: 13, fontWeight: "800" },
  heroBody: { color: c.muted, fontSize: 14, lineHeight: 22 },
  periods: { flexDirection: "row", gap: 10 },
  periodCard: {
    flex: 1,
    minHeight: 112,
    padding: 14,
    borderRadius: 10,
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
    borderRadius: 10,
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
    borderRadius: 10,
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
    borderRadius: 10,
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
    borderRadius: 10,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    gap: 12,
  },
  pressed: { opacity: 0.68 },
  topicTop: { flexDirection: "row", alignItems: "center", gap: 12 },
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
    borderRadius: 8,
    backgroundColor: c.green,
    alignItems: "center",
    justifyContent: "center",
  },
  retryText: { color: "white", fontWeight: "700" },
  empty: {
    padding: 30,
    borderRadius: 10,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: { color: c.ink, fontSize: 19, fontWeight: "700" },
  body: { color: c.muted, fontSize: 14, lineHeight: 22, textAlign: "center" },
});
