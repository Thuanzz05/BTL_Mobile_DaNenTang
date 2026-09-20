import type { ComponentProps } from "react";
import { useCallback, useEffect, useState } from "react";
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

type IconName = ComponentProps<typeof Ionicons>["name"];

interface Achievement {
  id: string;
  tieu_de: string;
  mo_ta: string;
  bieu_tuong: string;
  diem_thuong: number;
  da_mo_khoa: boolean;
  ngay_mo_khoa: string | null;
  tien_do: number;
  muc_tieu: number;
}

interface AchievementData {
  tong_so: number;
  da_mo_khoa: number;
  tong_diem: number;
  danh_sach: Achievement[];
}

const icons: Record<string, IconName> = {
  medal: "medal-outline",
  flame: "flame-outline",
  book: "book-outline",
  star: "star-outline",
};

export default function AchievementsScreen() {
  const { client, ready, user } = useAuth();
  const [data, setData] = useState<AchievementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      setData(await client.authorized<AchievementData>("/achievements"));
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
    void load();
  }, [load, ready, user]);

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
          <Text style={s.eyebrow}>DẤU MỐC HỌC TẬP</Text>
          <Text style={s.heading}>Thành tích & huy hiệu</Text>
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
              <View style={s.heroIcon}>
                <Ionicons name="trophy" size={34} color="#F8D675" />
              </View>
              <View style={s.heroText}>
                <Text style={s.heroLabel}>BỘ SƯU TẬP CỦA BẠN</Text>
                <Text style={s.heroTitle}>
                  {data.da_mo_khoa}/{data.tong_so} huy hiệu
                </Text>
              </View>
              <View style={s.points}>
                <Text style={s.pointsNumber}>{data.tong_diem}</Text>
                <Text style={s.pointsLabel}>điểm</Text>
              </View>
            </View>

            <View style={s.sectionHeading}>
              <Text style={s.sectionTitle}>Tất cả huy hiệu</Text>
              <Text style={s.sectionNote}>Học đều để mở khóa</Text>
            </View>

            {data.danh_sach.length ? (
              data.danh_sach.map((achievement) => {
                const progress = achievement.muc_tieu
                  ? Math.min(
                      100,
                      (achievement.tien_do / achievement.muc_tieu) * 100,
                    )
                  : 0;
                return (
                  <View
                    key={achievement.id}
                    style={[s.card, achievement.da_mo_khoa && s.cardUnlocked]}
                  >
                    <View
                      style={[
                        s.badge,
                        achievement.da_mo_khoa
                          ? s.badgeUnlocked
                          : s.badgeLocked,
                      ]}
                    >
                      <Ionicons
                        name={
                          achievement.da_mo_khoa
                            ? icons[achievement.bieu_tuong] || "trophy-outline"
                            : "lock-closed-outline"
                        }
                        size={30}
                        color={achievement.da_mo_khoa ? c.green : c.muted}
                      />
                    </View>
                    <View style={s.cardBody}>
                      <View style={s.titleRow}>
                        <Text style={s.cardTitle}>{achievement.tieu_de}</Text>
                        <Text style={s.reward}>+{achievement.diem_thuong}</Text>
                      </View>
                      <Text style={s.description}>{achievement.mo_ta}</Text>
                      <View
                        accessibilityRole="progressbar"
                        accessibilityValue={{
                          min: 0,
                          max: achievement.muc_tieu,
                          now: achievement.tien_do,
                        }}
                        style={s.track}
                      >
                        <View style={[s.fill, { width: `${progress}%` }]} />
                      </View>
                      <View style={s.progressRow}>
                        <Text style={s.progressText}>
                          {achievement.tien_do}/{achievement.muc_tieu}
                        </Text>
                        <Text
                          style={achievement.da_mo_khoa ? s.unlocked : s.locked}
                        >
                          {achievement.da_mo_khoa
                            ? `Đã mở khóa${
                                achievement.ngay_mo_khoa
                                  ? ` · ${new Date(
                                      achievement.ngay_mo_khoa,
                                    ).toLocaleDateString("vi-VN")}`
                                  : ""
                              }`
                            : "Chưa mở khóa"}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={s.message}>
                <Ionicons name="trophy-outline" size={42} color={c.muted} />
                <Text style={s.description}>Chưa có huy hiệu nào.</Text>
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: c.background },
  header: {
    paddingHorizontal: 22,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    maxWidth: 650,
    width: "100%",
    alignSelf: "center",
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: c.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: c.line,
  },
  headerText: { flex: 1 },
  eyebrow: {
    color: c.green,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  heading: { color: c.ink, fontSize: 25, fontWeight: "800", marginTop: 3 },
  content: {
    padding: 22,
    paddingBottom: 46,
    gap: 16,
    maxWidth: 650,
    width: "100%",
    alignSelf: "center",
  },
  hero: {
    backgroundColor: c.green,
    padding: 20,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.13)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroText: { flex: 1 },
  heroLabel: {
    color: "#CDE4D8",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  heroTitle: { color: "white", fontSize: 21, fontWeight: "800", marginTop: 5 },
  points: { alignItems: "center" },
  pointsNumber: { color: "#F8D675", fontSize: 25, fontWeight: "900" },
  pointsLabel: { color: "white", fontSize: 12, fontWeight: "600" },
  sectionHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 8,
  },
  sectionTitle: { color: c.ink, fontSize: 19, fontWeight: "800" },
  sectionNote: { color: c.muted, fontSize: 12 },
  card: {
    backgroundColor: c.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: c.line,
    padding: 16,
    flexDirection: "row",
    gap: 14,
  },
  cardUnlocked: { borderColor: "#B9D5C5", backgroundColor: "#FBFDFB" },
  badge: {
    width: 58,
    height: 58,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeUnlocked: { backgroundColor: c.peach },
  badgeLocked: { backgroundColor: "#EEF1ED" },
  cardBody: { flex: 1, gap: 7 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { flex: 1, color: c.ink, fontSize: 17, fontWeight: "800" },
  reward: { color: c.green, fontSize: 13, fontWeight: "800" },
  description: { color: c.muted, fontSize: 14, lineHeight: 20 },
  track: {
    height: 7,
    borderRadius: 5,
    backgroundColor: c.line,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 5, backgroundColor: c.green },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  progressText: { color: c.muted, fontSize: 12, fontWeight: "700" },
  unlocked: { color: c.green, fontSize: 12, fontWeight: "700" },
  locked: { color: c.muted, fontSize: 12, fontWeight: "600" },
  message: { padding: 30, alignItems: "center", gap: 12 },
  errorText: {
    color: c.danger,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
  },
  retry: {
    backgroundColor: c.green,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 13,
  },
  retryText: { color: "white", fontWeight: "700" },
});
