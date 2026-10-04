import { useCallback, useState } from "react";
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
import { Link, useFocusEffect } from "expo-router";
import { FlashcardPreview } from "@/components/flashcard-preview";
import { palette as c } from "@/constants/palette";
import { Fonts } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import type { Word } from "@/services/catalog";

interface ReviewWord extends Word {
  trang_thai_nho: string;
  so_lan_on_tap: number;
  ngan_leitner: number;
  ngay_on_tap_tiep_theo: string;
}

interface ReviewData {
  so_tu_can_on: number;
  danh_sach_tu: ReviewWord[];
}

interface ProgressData {
  tong_so_tu_da_hoc: number;
  ty_le: number;
  hom_nay: number;
}

export default function ReviewScreen() {
  const { client, ready, user } = useAuth();
  const [review, setReview] = useState<ReviewData | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quizCount, setQuizCount] = useState(0);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const [reviewData, progressData] = await Promise.all([
        client.authorized<ReviewData>("/progress/review?limit=20"),
        client.authorized<ProgressData>("/progress"),
      ]);
      setReview(reviewData);
      setProgress(progressData);
    } catch (loadError) {
      setError((loadError as Error).message);
    } finally {
      setLoading(false);
    }
  }, [client, user]);

  useFocusEffect(
    useCallback(() => {
      if (!ready || !user) return;
      let active = true;
      Promise.all([
        client.authorized<ReviewData>("/progress/review?limit=20"),
        client.authorized<ProgressData>("/progress"),
      ])
        .then(([reviewData, progressData]) => {
          if (!active) return;
          setReview(reviewData);
          setProgress(progressData);
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

  const due = review?.so_tu_can_on ?? 0;

  return (
    <SafeAreaView edges={["top"]} style={s.page}>
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
        <View style={s.header}>
          <View>
            <Text style={s.eyebrow}>Nhớ lâu hơn mỗi ngày</Text>
            <Text style={s.heading}>Ôn tập hôm nay</Text>
          </View>
          <Text style={s.headerMark}>HÔM NAY</Text>
        </View>

        {!ready ? (
          <ActivityIndicator size="large" color={c.green} />
        ) : !user ? (
          <View style={s.guestCard}>
            <View style={s.guestIcon}>
              <Feather name="calendar" size={31} color={c.green} />
            </View>
            <Text style={s.cardTitle}>Lịch ôn tập dành riêng cho bạn</Text>
            <Text style={s.body}>
              Đăng nhập để hệ thống ghi nhớ kết quả và tự chọn những từ bạn cần
              luyện lại.
            </Text>
            <Link href="/login" asChild>
              <Pressable accessibilityRole="button" style={s.primaryButton}>
                <Text style={s.primaryText}>Đăng nhập để ôn tập</Text>
                <Feather name="arrow-right" size={19} color="white" />
              </Pressable>
            </Link>
          </View>
        ) : (
          <>
            <View style={s.hero}>
              <View style={s.heroTop}>
                <View style={s.heroText}>
                  <Text style={s.heroLabel}>Đang chờ bạn</Text>
                  <Text style={s.heroNumber}>{due}</Text>
                  <Text style={s.heroUnit}>từ cần ôn</Text>
                </View>
                <Text style={s.heroMark}>LEITNER</Text>
              </View>
              <Text style={s.heroBody}>
                Leitner ưu tiên từ đến hạn. Trả lời đúng để lên ngăn tiếp theo;
                trả lời sai, từ trở về ngăn 1 và xuất hiện lại trong bài.
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={due === 0 || loading}
                onPress={() => setQuizCount(due)}
                style={[s.reviewButton, due === 0 && s.disabled]}
              >
                <Text style={s.reviewText}>
                  {due > 0
                    ? `Ôn ngay ${Math.min(20, due)} từ`
                    : "Đã ôn xong hôm nay"}
                </Text>
                <Feather
                  name={due > 0 ? "arrow-right" : "check"}
                  size={20}
                  color="white"
                />
              </Pressable>
            </View>

            <View style={s.stats}>
              <View style={s.stat}>
                <Text style={s.statNumber}>{progress?.ty_le ?? 0}%</Text>
                <Text style={s.statLabel}>đã ghi nhớ</Text>
              </View>
              <View style={s.divider} />
              <View style={s.stat}>
                <Text style={s.statNumber}>{progress?.hom_nay ?? 0}</Text>
                <Text style={s.statLabel}>từ hôm nay</Text>
              </View>
              <View style={s.divider} />
              <View style={s.stat}>
                <Text style={s.statNumber}>
                  {progress?.tong_so_tu_da_hoc ?? 0}
                </Text>
                <Text style={s.statLabel}>từ đã học</Text>
              </View>
            </View>

            {!!error && (
              <View style={s.errorBox}>
                <Text accessibilityRole="alert" style={s.errorText}>
                  {error}
                </Text>
                <Pressable accessibilityRole="button" onPress={load}>
                  <Text style={s.link}>Thử lại</Text>
                </Pressable>
              </View>
            )}

            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Từ đang chờ ôn</Text>
                <Text style={s.sectionCount}>
                  {review?.danh_sach_tu.length ?? 0}/{due}
                </Text>
              </View>

              {loading && !review ? (
                <ActivityIndicator color={c.green} />
              ) : due === 0 && !error ? (
                <View style={s.empty}>
                  <View style={s.emptyIcon}>
                    <Feather name="check-circle" size={42} color={c.green} />
                  </View>
                  <Text style={s.cardTitle}>Bạn đã hoàn thành hôm nay</Text>
                  <Text style={s.body}>
                    Chưa có từ đến hạn. Từ mới ở ngăn 1 sẽ xuất hiện tại đây sau
                    1 ngày; các ngăn sau lần lượt là 2, 4, 7 và 14 ngày.
                  </Text>
                </View>
              ) : (
                review?.danh_sach_tu.map((word) => (
                  <View key={word.id} style={s.wordCard}>
                    <View style={s.wordInfo}>
                      <Text style={s.word}>{word.tu_tieng_anh}</Text>
                      {!!word.phien_am && (
                        <Text style={s.phonetic}>{word.phien_am}</Text>
                      )}
                      <Text style={s.meaning}>{word.nghia_tieng_viet}</Text>
                    </View>
                    <View style={s.reviewBadge}>
                      <Text style={s.reviewBadgeText}>
                        Ngăn {Number(word.ngan_leitner) || 1}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      {quizCount > 0 && (
        <FlashcardPreview
          topic={null}
          reviewCount={quizCount}
          onClose={() => setQuizCount(0)}
          onCompleted={() => void load()}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: c.background },
  content: {
    width: "100%",
    maxWidth: 650,
    alignSelf: "center",
    padding: 22,
    paddingBottom: 40,
    gap: 22,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  eyebrow: {
    color: c.green,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.2,
    marginBottom: 5,
  },
  heading: { color: c.ink, fontSize: 30, fontWeight: "800" },
  headerMark: { color: c.rust, fontSize: 10, fontWeight: "800" },
  guestCard: {
    marginTop: 36,
    padding: 26,
    borderRadius: 10,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    alignItems: "center",
    gap: 15,
  },
  guestIcon: {
    width: 76,
    height: 76,
    borderRadius: 10,
    backgroundColor: c.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    color: c.ink,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  body: { color: c.muted, fontSize: 14, lineHeight: 22, textAlign: "center" },
  primaryButton: {
    width: "100%",
    minHeight: 52,
    borderRadius: 8,
    backgroundColor: c.green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  primaryText: { color: "white", fontSize: 15, fontWeight: "700" },
  hero: {
    padding: 22,
    borderRadius: 10,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    borderLeftWidth: 5,
    borderLeftColor: c.rust,
    gap: 17,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroText: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  heroLabel: {
    position: "absolute",
    top: -15,
    color: c.rust,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  heroNumber: { color: c.ink, fontSize: 48, fontWeight: "800" },
  heroUnit: { color: c.muted, fontSize: 16, fontWeight: "600" },
  heroMark: { color: c.rust, fontSize: 11, fontWeight: "800" },
  heroBody: { color: c.muted, fontSize: 14, lineHeight: 22 },
  reviewButton: {
    minHeight: 54,
    borderRadius: 8,
    paddingHorizontal: 18,
    backgroundColor: c.green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reviewText: { color: "white", fontSize: 16, fontWeight: "700" },
  disabled: { opacity: 0.72 },
  stats: {
    paddingVertical: 18,
    borderRadius: 10,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    flexDirection: "row",
    alignItems: "center",
  },
  stat: { flex: 1, alignItems: "center", gap: 4 },
  statNumber: { color: c.ink, fontSize: 21, fontWeight: "800" },
  statLabel: { color: c.muted, fontSize: 11, textAlign: "center" },
  divider: { width: 1, height: 34, backgroundColor: c.line },
  errorBox: {
    padding: 17,
    borderRadius: 10,
    backgroundColor: "#FCECE8",
    gap: 8,
  },
  errorText: { color: c.danger, lineHeight: 21 },
  link: { color: c.green, fontWeight: "700" },
  section: { gap: 12 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { color: c.ink, fontSize: 20, fontWeight: "700" },
  sectionCount: { color: c.muted, fontSize: 12 },
  empty: {
    padding: 28,
    borderRadius: 10,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    alignItems: "center",
    gap: 13,
  },
  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: c.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  wordCard: {
    padding: 16,
    borderRadius: 10,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  wordInfo: { flex: 1, gap: 3 },
  word: {
    color: c.ink,
    fontFamily: Fonts.serif,
    fontSize: 20,
    fontWeight: "700",
  },
  phonetic: { color: c.muted, fontSize: 12 },
  meaning: { color: c.ink, fontSize: 14 },
  reviewBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: c.peach,
  },
  reviewBadgeText: { color: c.ink, fontSize: 10, fontWeight: "700" },
});
