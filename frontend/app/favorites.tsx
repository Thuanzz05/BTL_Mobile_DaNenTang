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
import { useAuth } from "@/contexts/auth-context";
import { palette as c } from "@/constants/palette";
import type { Word } from "@/services/catalog";

interface FavoriteWord extends Word {
  chu_de_ten: string;
}

export default function FavoritesScreen() {
  const { client, user, ready } = useAuth();
  const [words, setWords] = useState<FavoriteWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      setWords(await client.authorized<FavoriteWord[]>("/favorites"));
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
      .authorized<FavoriteWord[]>("/favorites")
      .then((data) => {
        if (active) setWords(data);
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

  async function remove(word: FavoriteWord) {
    if (removing) return;
    setRemoving(word.id);
    setError("");
    try {
      await client.authorized(`/favorites/${word.id}`, { method: "DELETE" });
      setWords((current) => current.filter((item) => item.id !== word.id));
    } catch (removeError) {
      setError((removeError as Error).message);
    } finally {
      setRemoving("");
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
          <Text style={s.eyebrow}>THƯ VIỆN CỦA BẠN</Text>
          <Text style={s.heading}>Từ yêu thích</Text>
        </View>
        <View style={s.count}>
          <Text style={s.countText}>{words.length}</Text>
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
        {loading && words.length === 0 ? (
          <ActivityIndicator size="large" color={c.green} />
        ) : words.length === 0 && !error ? (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="heart-outline" size={38} color={c.green} />
            </View>
            <Text style={s.emptyTitle}>Chưa có từ yêu thích</Text>
            <Text style={s.body}>
              Khi luyện tập, hãy bấm “Lưu từ này” để gom những từ cần xem lại
              vào đây.
            </Text>
            <Pressable
              accessibilityRole="button"
              style={s.button}
              onPress={() => router.dismissTo("/")}
            >
              <Text style={s.white}>Bắt đầu luyện tập</Text>
            </Pressable>
          </View>
        ) : (
          words.map((word) => (
            <View key={word.id} style={s.card}>
              <View style={s.wordInfo}>
                <Text style={s.topic}>{word.chu_de_ten}</Text>
                <Text style={s.word}>{word.tu_tieng_anh}</Text>
                {!!word.phien_am && (
                  <Text style={s.phonetic}>{word.phien_am}</Text>
                )}
                <Text style={s.meaning}>{word.nghia_tieng_viet}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Bỏ yêu thích ${word.tu_tieng_anh}`}
                disabled={!!removing}
                style={s.remove}
                onPress={() => remove(word)}
              >
                {removing === word.id ? (
                  <ActivityIndicator color={c.green} />
                ) : (
                  <Ionicons name="heart" size={24} color={c.green} />
                )}
              </Pressable>
            </View>
          ))
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
  count: {
    minWidth: 42,
    height: 42,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: c.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: { color: c.green, fontWeight: "800" },
  content: {
    padding: 22,
    gap: 12,
    width: "100%",
    maxWidth: 580,
    alignSelf: "center",
    paddingBottom: 36,
  },
  card: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  wordInfo: { flex: 1, gap: 5 },
  topic: { color: c.green, fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  word: { color: c.ink, fontSize: 21, fontWeight: "800" },
  phonetic: { color: c.muted, fontSize: 13 },
  meaning: { color: c.ink, fontSize: 15 },
  remove: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: c.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { paddingVertical: 70, alignItems: "center", gap: 16 },
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
