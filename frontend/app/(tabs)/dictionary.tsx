import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { palette as c } from "@/constants/palette";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/services/api";
import type { WordSearchResult } from "@/services/catalog";

const pageSize = 20;

export default function DictionaryScreen() {
  const { client, user } = useAuth();
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [result, setResult] = useState<WordSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setTerm(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const request = useCallback(
    (page: number) => {
      const path = `/words?search=${encodeURIComponent(term)}&page=${page}&limit=${pageSize}`;
      return user
        ? client.authorized<WordSearchResult>(path)
        : api<WordSearchResult>(path);
    },
    [client, term, user],
  );

  useEffect(() => {
    let active = true;
    request(1)
      .then((data) => {
        if (active) {
          setResult(data);
          setError("");
        }
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
  }, [request]);

  async function loadMore() {
    if (
      !result ||
      loadingMore ||
      result.pagination.page >= result.pagination.totalPages
    )
      return;
    setLoadingMore(true);
    setError("");
    try {
      const next = await request(result.pagination.page + 1);
      setResult({
        items: [...result.items, ...next.items],
        pagination: next.pagination,
      });
    } catch (loadError) {
      setError((loadError as Error).message);
    } finally {
      setLoadingMore(false);
    }
  }

  const words = result?.items ?? [];
  const total = result?.pagination.total ?? 0;
  const hasMore = Boolean(
    result && result.pagination.page < result.pagination.totalPages,
  );

  function updateSearch(value: string) {
    setSearch(value);
    setLoading(true);
    setError("");
  }

  return (
    <SafeAreaView edges={["top"]} style={s.page}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
      >
        <View style={s.header}>
          <View>
            <Text style={s.eyebrow}>KHO TỪ VỰNG</Text>
            <Text style={s.heading}>Tra từ</Text>
          </View>
          <View style={s.headerIcon}>
            <Ionicons name="book-outline" size={25} color={c.green} />
          </View>
        </View>

        <View style={s.searchBox}>
          <Ionicons name="search" size={21} color={c.muted} />
          <TextInput
            accessibilityLabel="Tìm từ vựng"
            value={search}
            onChangeText={updateSearch}
            placeholder="Nhập từ tiếng Anh hoặc nghĩa tiếng Việt"
            placeholderTextColor={c.muted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={s.input}
          />
          {!!search && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Xóa nội dung tìm kiếm"
              onPress={() => updateSearch("")}
              style={s.clear}
            >
              <Ionicons name="close-circle" size={21} color={c.muted} />
            </Pressable>
          )}
        </View>

        <View style={s.resultHeader}>
          <Text style={s.resultTitle}>
            {term ? "Kết quả tìm kiếm" : "Tất cả từ vựng"}
          </Text>
          {!loading && <Text style={s.count}>{total} từ</Text>}
        </View>

        {!!error && (
          <View style={s.errorBox}>
            <Ionicons name="cloud-offline-outline" size={24} color={c.danger} />
            <Text accessibilityRole="alert" style={s.errorText}>
              {error}
            </Text>
          </View>
        )}

        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={c.green} />
            <Text style={s.body}>Đang tìm trong kho từ…</Text>
          </View>
        ) : !words.length && !error ? (
          <View style={s.center}>
            <View style={s.emptyIcon}>
              <Ionicons name="search-outline" size={37} color={c.green} />
            </View>
            <Text style={s.emptyTitle}>Không tìm thấy từ</Text>
            <Text style={s.body}>
              Thử một từ khóa ngắn hơn hoặc tìm bằng nghĩa tiếng Việt.
            </Text>
          </View>
        ) : (
          words.map((word) => (
            <Pressable
              key={word.id}
              accessibilityRole="button"
              accessibilityLabel={`Xem chi tiết từ ${word.tu_tieng_anh}`}
              onPress={() =>
                router.push({ pathname: "/word", params: { wordId: word.id } })
              }
              style={({ pressed }) => [s.card, pressed && s.pressed]}
            >
              <View style={s.wordIcon}>
                <Text style={s.initial}>
                  {word.tu_tieng_anh.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={s.wordInfo}>
                <View style={s.wordLine}>
                  <Text style={s.word}>{word.tu_tieng_anh}</Text>
                  {!!word.phien_am && (
                    <Text style={s.phonetic}>{word.phien_am}</Text>
                  )}
                </View>
                <Text numberOfLines={2} style={s.meaning}>
                  {word.nghia_tieng_viet}
                </Text>
                {!!word.chu_de_ten && (
                  <Text style={s.topic}>{word.chu_de_ten}</Text>
                )}
              </View>
              {Boolean(word.da_yeu_thich) && (
                <Ionicons name="heart" size={18} color={c.green} />
              )}
              <Ionicons name="chevron-forward" size={20} color={c.muted} />
            </Pressable>
          ))
        )}

        {hasMore && !loading && (
          <Pressable
            accessibilityRole="button"
            disabled={loadingMore}
            onPress={loadMore}
            style={s.moreButton}
          >
            {loadingMore ? (
              <ActivityIndicator color={c.green} />
            ) : (
              <>
                <Text style={s.moreText}>Xem thêm từ</Text>
                <Ionicons name="chevron-down" size={19} color={c.green} />
              </>
            )}
          </Pressable>
        )}
      </ScrollView>
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
    paddingBottom: 42,
    gap: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  eyebrow: {
    color: c.green,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  heading: { color: c.ink, fontSize: 30, fontWeight: "800", marginTop: 4 },
  headerIcon: {
    width: 49,
    height: 49,
    borderRadius: 17,
    backgroundColor: c.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBox: {
    minHeight: 56,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: { flex: 1, color: c.ink, fontSize: 15, paddingVertical: 14 },
  clear: {
    width: 32,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  resultHeader: {
    marginTop: 7,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultTitle: { color: c.ink, fontSize: 18, fontWeight: "800" },
  count: { color: c.muted, fontSize: 12, fontWeight: "600" },
  card: {
    padding: 15,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pressed: { opacity: 0.72 },
  wordIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: c.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: { color: c.green, fontSize: 22, fontWeight: "900" },
  wordInfo: { flex: 1, gap: 3 },
  wordLine: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: 7,
  },
  word: { color: c.ink, fontSize: 18, fontWeight: "800" },
  phonetic: { color: c.muted, fontSize: 12 },
  meaning: { color: c.ink, fontSize: 14, lineHeight: 19 },
  topic: {
    color: c.green,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  center: { paddingVertical: 55, alignItems: "center", gap: 13 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: c.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { color: c.ink, fontSize: 21, fontWeight: "800" },
  body: { color: c.muted, fontSize: 14, lineHeight: 21, textAlign: "center" },
  errorBox: {
    padding: 15,
    borderRadius: 16,
    backgroundColor: "#FCECE8",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  errorText: { flex: 1, color: c.danger, fontSize: 14, lineHeight: 20 },
  moreButton: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: c.soft,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  moreText: { color: c.green, fontSize: 14, fontWeight: "800" },
});
