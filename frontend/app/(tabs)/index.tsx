import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
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
import { getTopics, Topic } from "@/services/catalog";

export default function HomeScreen() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Topic | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setTopics(await getTopics());
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
              <Ionicons name="layers" size={23} color="white" />
            </View>
            <Text style={s.brandText}>
              Wordleaf<Text style={s.brandDot}>.</Text>
            </Text>
          </View>
          <Link href="/login" asChild>
            <Pressable accessibilityRole="button" style={s.login}>
              <Text style={s.link}>Đăng nhập</Text>
              <Ionicons name="arrow-forward" size={16} color={c.green} />
            </Pressable>
          </Link>
        </View>
        <View style={s.greeting}>
          <Text style={s.eyebrow}>MỖI NGÀY MỘT CHÚT TIẾN BỘ</Text>
          <Text style={s.heading}>
            Từ mới hôm nay,{"\n"}tự tin hơn ngày mai.
          </Text>
          <Text style={s.body}>
            Cùng xây vốn từ tiếng Anh của bạn,{"\n"}bắt đầu từ một tấm
            flashcard.
          </Text>
        </View>
        <View style={s.hero}>
          <View style={s.row}>
            <View style={s.badge}>
              <Ionicons name="sparkles-outline" size={15} color={c.green} />
              <Text style={s.badgeText}>GÓC HỌC TẬP</Text>
            </View>
            <Ionicons name="leaf-outline" size={38} color="#B4CFAE" />
          </View>
          <Text style={s.heroTitle}>Một thẻ nhỏ.{"\n"}Một điều mới.</Text>
          <Text style={s.heroBody}>
            Nhìn từ, lật thẻ, ghi nhớ.{"\n"}Học theo nhịp của riêng bạn.
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={!first}
            onPress={() => first && setSelected(first)}
            style={[s.cta, !first && s.disabled]}
          >
            <Text style={s.ctaText}>Bắt đầu học thử</Text>
            <Ionicons name="arrow-forward" size={20} color={c.ink} />
          </Pressable>
          <Text style={s.heroNote}>Miễn phí · Không cần tài khoản</Text>
        </View>
        <View style={s.section}>
          <View style={s.row}>
            <Text style={s.sectionTitle}>Bạn muốn học gì?</Text>
            <Text style={s.count}>{topics.length} chủ đề</Text>
          </View>
          <View style={s.search}>
            <Ionicons name="search-outline" size={20} color={c.muted} />
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
                <Ionicons name="close-circle" size={20} color={c.muted} />
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
              <Ionicons name="search-outline" size={30} color={c.muted} />
              <Text style={s.body}>
                {search
                  ? "Không tìm thấy chủ đề phù hợp."
                  : "Chủ đề mới sẽ sớm được cập nhật."}
              </Text>
            </View>
          ) : (
            Array.from({ length: Math.ceil(filtered.length / 2) }, (_, i) => (
              <View key={filtered[i * 2].id} style={s.topicRow}>
                {filtered.slice(i * 2, i * 2 + 2).map((topic) => (
                  <TopicCard
                    key={topic.id}
                    topic={topic}
                    onPress={() => setSelected(topic)}
                  />
                ))}
                {!filtered[i * 2 + 1] && <View style={s.spacer} />}
              </View>
            ))
          )}
        </View>
        <View style={s.join}>
          <View style={s.joinIcon}>
            <Ionicons name="bookmark-outline" size={24} color={c.green} />
          </View>
          <View style={s.spacer}>
            <Text style={s.joinTitle}>Lưu lại từng bước tiến</Text>
            <Text style={s.body}>
              Tạo tài khoản để lưu từ yêu thích và theo dõi tiến độ học tập.
            </Text>
            <Link href="/register" asChild>
              <Pressable accessibilityRole="button" style={s.register}>
                <Text style={s.link}>Tạo tài khoản miễn phí</Text>
                <Ionicons name="arrow-forward" size={17} color={c.green} />
              </Pressable>
            </Link>
          </View>
        </View>
        <Text style={s.bottom}>Học một chút. Nhớ lâu hơn.</Text>
      </ScrollView>
      <FlashcardPreview topic={selected} onClose={() => setSelected(null)} />
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: c.background },
  content: {
    padding: 22,
    gap: 28,
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
    borderRadius: 13,
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
  greeting: { gap: 12 },
  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.7,
    color: c.green,
  },
  heading: {
    fontSize: 32,
    lineHeight: 41,
    letterSpacing: -1,
    fontWeight: "800",
    color: c.ink,
  },
  body: { fontSize: 14, color: c.muted, lineHeight: 23 },
  hero: { padding: 24, borderRadius: 26, backgroundColor: c.green, gap: 14 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E1EFCE",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    color: c.green,
  },
  heroTitle: {
    fontSize: 30,
    lineHeight: 37,
    color: "white",
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  heroBody: { color: "#DFEBE2", fontSize: 14, lineHeight: 23 },
  cta: {
    minHeight: 52,
    borderRadius: 15,
    backgroundColor: "#DCECBA",
    paddingHorizontal: 19,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  ctaText: { color: c.ink, fontWeight: "700", fontSize: 16 },
  heroNote: { fontSize: 11, color: "#DFEBE2", textAlign: "center" },
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
    borderRadius: 15,
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
  topicRow: { flexDirection: "row", gap: 12 },
  spacer: { flex: 1 },
  empty: { paddingVertical: 22, alignItems: "center", gap: 12 },
  join: {
    flexDirection: "row",
    gap: 12,
    padding: 19,
    backgroundColor: c.soft,
    borderRadius: 20,
  },
  joinIcon: { paddingTop: 2 },
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
