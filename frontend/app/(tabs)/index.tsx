import { useAuth } from "@/contexts/auth-context";
import { HomeProgress } from "@/components/home-progress";
import { ResumeLearningCard } from "@/components/resume-learning-card";
import { Feather } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { TopicCard } from "@/components/topic-card";
import { FlashcardPreview } from "@/components/flashcard-preview";
import { palette as c } from "@/constants/palette";
import { Fonts } from "@/constants/theme";
import { getTopics, Topic } from "@/services/catalog";

export default function HomeScreen() {
  const { user, ready } = useAuth();
  const [revision, setRevision] = useState(0);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [reviewCount, setReviewCount] = useState(0);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setTopics(await getTopics());
      setRevision((v) => v + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    let active = true;
    getTopics()
      .then((data) => {
        if (active) setTopics(data);
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
  }, []);
  const filtered = topics.filter((t) =>
    t.ten
      .toLocaleLowerCase("vi")
      .includes(search.trim().toLocaleLowerCase("vi")),
  );
  const first = topics.find((t) => t.word_count > 0);
  const study = (topic: Topic) =>
    router.push({
      pathname: "/study",
      params: { topicId: topic.id, topicName: topic.ten },
    });
  const openTopic = (topic: Topic) =>
    router.push({
      pathname: "/topic",
      params: { topicId: topic.id },
    });
  return (
    <SafeAreaView edges={["top"]} style={s.page}>
      <StatusBar style="dark" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={c.green}
          />
        }
        contentContainerStyle={s.content}
      >
        <View style={s.row}>
          <View style={s.brand}>
            <View style={s.logo}>
              <Feather name="book-open" size={20} color="white" />
            </View>
            <Text style={s.brandText}>
              Wordleaf<Text style={s.brandDot}>.</Text>
            </Text>
          </View>
          <Link href={user ? "/(tabs)/account" : "/login"} asChild>
            <Pressable accessibilityRole="button" style={s.login}>
              <Text style={s.link}>{user ? "Tài khoản" : "Đăng nhập"}</Text>
              <Feather name="arrow-right" size={16} color={c.green} />
            </Pressable>
          </Link>
        </View>
        <View style={s.greeting}>
          <Text style={s.eyebrow}>Sổ từ vựng mỗi ngày</Text>
          <Text style={s.heading}>Ghi lại một từ.{"\n"}Nhớ thêm một điều.</Text>
          <Text style={s.body}>
            Học bằng flashcard, nghe cách đọc và quay lại ôn đúng lúc.
          </Text>
        </View>
        {!ready && <ActivityIndicator color={c.green} />}
        <ResumeLearningCard
          onUpdated={() => setRevision((value) => value + 1)}
        />
        {ready && user && (
          <HomeProgress
            key={`${user.id}-${revision}`}
            onReview={setReviewCount}
          />
        )}
        <View style={s.hero}>
          <View style={s.row}>
            <View style={s.badge}>
              <Text style={s.badgeMark}>01</Text>
              <Text style={s.badgeText}>Bắt đầu một phiên học</Text>
            </View>
            <Text style={s.heroMark}>wordleaf / 01</Text>
          </View>
          <Text style={s.heroTitle}>Mở bộ thẻ đầu tiên</Text>
          <Text style={s.heroBody}>
            {user
              ? "Lật thẻ, nghe phát âm, xem nghĩa.\nSau đó ôn lại bằng trắc nghiệm."
              : "Lật thẻ, nghe phát âm và xem nghĩa. Học thử không lưu kết quả."}
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={!first}
            onPress={() => first && study(first)}
            style={[s.cta, !first && s.disabled]}
          >
            <Text style={s.ctaText}>
              {user ? "Học flashcard" : "Học flashcard miễn phí"}
            </Text>
            <Feather name="arrow-right" size={20} color="white" />
          </Pressable>
          <Text style={s.heroNote}>
            {user
              ? "Kết quả tự động lưu vào tài khoản"
              : "Miễn phí, không cần tài khoản"}
          </Text>
        </View>
        <View style={s.section}>
          <View style={s.row}>
            <Text style={s.sectionTitle}>Bạn muốn học gì?</Text>
            <Text style={s.count}>{topics.length} chủ đề</Text>
          </View>
          <View style={s.search}>
            <Feather name="search" size={19} color={c.muted} />
            <TextInput
              accessibilityLabel="Tìm chủ đề"
              placeholder="Tìm chủ đề yêu thích..."
              placeholderTextColor={c.muted}
              value={search}
              onChangeText={setSearch}
              style={s.input}
            />
            {search.length > 0 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Xóa tìm kiếm"
                onPress={() => setSearch("")}
                style={s.clear}
              >
                <Feather name="x-circle" size={19} color={c.muted} />
              </Pressable>
            )}
          </View>
          {loading && topics.length === 0 ? (
            <ActivityIndicator color={c.green} />
          ) : error ? (
            <View style={s.empty}>
              <Text style={s.body}>{error}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={load}
                style={s.login}
              >
                <Text style={s.link}>Thử kết nối lại</Text>
              </Pressable>
            </View>
          ) : !filtered.length ? (
            <View style={s.empty}>
              <Feather name="search" size={28} color={c.muted} />
              <Text style={s.body}>
                {search
                  ? "Không tìm thấy chủ đề phù hợp."
                  : "Chủ đề mới sẽ sớm được cập nhật."}
              </Text>
            </View>
          ) : (
            filtered.map((topic) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                onPress={() => openTopic(topic)}
              />
            ))
          )}
        </View>
        {!user && ready && (
          <View style={s.join}>
            <View style={s.spacer}>
              <Text style={s.joinTitle}>Lưu lại từng bước tiến</Text>
              <Text style={s.body}>
                Tạo tài khoản để lưu từ yêu thích và theo dõi tiến độ học tập.
              </Text>
              <Link href="/register" asChild>
                <Pressable accessibilityRole="button" style={s.register}>
                  <Text style={s.link}>Tạo tài khoản miễn phí</Text>
                  <Feather name="arrow-right" size={17} color={c.green} />
                </Pressable>
              </Link>
            </View>
          </View>
        )}
        <Text style={s.bottom}>Học một chút. Nhớ lâu hơn.</Text>
      </ScrollView>
      {reviewCount > 0 && (
        <FlashcardPreview
          key={`review-${reviewCount}`}
          topic={null}
          reviewCount={reviewCount}
          onClose={() => {
            setReviewCount(0);
            setRevision((value) => value + 1);
          }}
          onCompleted={() => setRevision((value) => value + 1)}
        />
      )}
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: c.background },
  content: {
    padding: 22,
    gap: 24,
    maxWidth: 650,
    width: "100%",
    alignSelf: "center",
    paddingBottom: 32,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  brand: { flexDirection: "row", gap: 9, alignItems: "center" },
  logo: {
    width: 38,
    height: 38,
    backgroundColor: c.green,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    fontSize: 23,
    color: c.ink,
    fontWeight: "800",
    letterSpacing: -1,
  },
  brandDot: { color: c.green },
  login: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 7 },
  link: { color: c.green, fontSize: 14, fontWeight: "700" },
  greeting: {
    gap: 10,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: c.line,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "600",
    color: c.green,
  },
  heading: {
    fontFamily: Fonts.sans,
    fontSize: 36,
    lineHeight: 46,
    fontWeight: "800",
    color: c.ink,
  },
  body: { fontSize: 14, color: c.muted, lineHeight: 23 },
  hero: {
    padding: 22,
    borderRadius: 10,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    borderLeftWidth: 5,
    borderLeftColor: c.rust,
    gap: 14,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: c.rust,
  },
  badgeMark: { color: c.rust, fontSize: 10, fontWeight: "800" },
  heroMark: { color: c.muted, fontSize: 11 },
  heroTitle: {
    fontFamily: Fonts.sans,
    fontSize: 29,
    lineHeight: 36,
    color: c.ink,
    fontWeight: "800",
  },
  heroBody: { color: c.muted, fontSize: 14, lineHeight: 23 },
  cta: {
    minHeight: 52,
    borderRadius: 8,
    backgroundColor: c.green,
    paddingHorizontal: 19,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  ctaText: { color: "white", fontWeight: "700", fontSize: 16 },
  heroNote: { fontSize: 11, color: c.muted },
  disabled: { opacity: 0.5 },
  section: { gap: 14 },
  sectionTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: c.ink,
    letterSpacing: -0.4,
  },
  count: { color: c.muted, fontSize: 12 },
  search: {
    minHeight: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: c.line,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 14,
    backgroundColor: "white",
    gap: 9,
  },
  input: { flex: 1, color: c.ink, fontSize: 14, paddingVertical: 14 },
  clear: { padding: 12 },
  spacer: { flex: 1 },
  empty: { paddingVertical: 22, alignItems: "center", gap: 12 },
  join: {
    flexDirection: "row",
    gap: 12,
    padding: 19,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    borderLeftWidth: 4,
    borderLeftColor: c.green,
    borderRadius: 8,
  },
  joinTitle: { fontSize: 16, fontWeight: "700", color: c.ink, marginBottom: 6 },
  register: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  bottom: { textAlign: "center", fontSize: 12, color: c.muted },
});
