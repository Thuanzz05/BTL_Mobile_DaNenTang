import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, FontAwesome } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { usePronunciation } from "@/hooks/use-pronunciation";
import { palette as c } from "@/constants/palette";
import { Fonts } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/services/api";
import type { WordDetail } from "@/services/catalog";

const wordTypes: Record<string, string> = {
  "danh-tu": "Danh từ",
  "dong-tu": "Động từ",
  "tinh-tu": "Tính từ",
  "trang-tu": "Trạng từ",
  "gioi-tu": "Giới từ",
  "lien-tu": "Liên từ",
  "dai-tu": "Đại từ",
  "tham-tu": "Thán từ",
};

export default function WordScreen() {
  const params = useLocalSearchParams<{ wordId?: string }>();
  const wordId = Array.isArray(params.wordId)
    ? params.wordId[0]
    : params.wordId;
  const { client, ready, user } = useAuth();
  const [word, setWord] = useState<WordDetail | null>(null);
  const { pronounce, audioMessage } = usePronunciation(word?.tu_tieng_anh);
  const [loading, setLoading] = useState(Boolean(wordId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const load = useCallback(async () => {
    if (!wordId) return;
    const path = `/words/${encodeURIComponent(wordId)}`;
    return user ? client.authorized<WordDetail>(path) : api<WordDetail>(path);
  }, [client, user, wordId]);

  useEffect(() => {
    if (!wordId) return;
    let active = true;
    load()
      .then((data) => {
        if (active && data) {
          setWord(data);
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
  }, [attempt, load, wordId]);

  async function toggleFavorite() {
    if (!word || saving) return;
    if (!ready || !user) {
      router.push("/login");
      return;
    }
    setSaving(true);
    setError("");
    const wasFavorite = Boolean(word.da_yeu_thich);
    try {
      await client.authorized(`/favorites/${word.id}`, {
        method: wasFavorite ? "DELETE" : "PUT",
      });
      setWord({ ...word, da_yeu_thich: !wasFavorite });
    } catch (saveError) {
      setError((saveError as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={s.page}>
      <View style={s.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          style={s.headerButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={23} color={c.ink} />
        </Pressable>
        <Text style={s.headerTitle}>Chi tiết từ vựng</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            word?.da_yeu_thich ? "Bỏ yêu thích" : "Thêm vào yêu thích"
          }
          disabled={!word || saving}
          style={s.headerButton}
          onPress={toggleFavorite}
        >
          {saving ? (
            <ActivityIndicator color={c.green} />
          ) : (
            <FontAwesome
              name={word?.da_yeu_thich ? "heart" : "heart-o"}
              size={24}
              color={word?.da_yeu_thich ? c.green : c.ink}
            />
          )}
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
      >
        {!wordId ? (
          <Message
            title="Không tìm thấy từ"
            body="Hãy quay lại trang Tra từ và chọn một từ khác."
            action="Về trang Tra từ"
            onPress={() => router.replace("/(tabs)/dictionary")}
          />
        ) : loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={c.green} />
            <Text style={s.body}>Đang tải từ vựng…</Text>
          </View>
        ) : error && !word ? (
          <Message
            title="Chưa tải được từ vựng"
            body={error}
            action="Thử lại"
            onPress={() => {
              setLoading(true);
              setError("");
              setAttempt((value) => value + 1);
            }}
          />
        ) : word ? (
          <>
            {!!error && (
              <Text accessibilityRole="alert" style={s.inlineError}>
                {error}
              </Text>
            )}
            <View style={s.hero}>
              <View style={s.heroTop}>
                <View style={s.typeBadge}>
                  <Text style={s.typeText}>
                    {wordTypes[word.loai_tu] || word.loai_tu}
                  </Text>
                </View>
                {!!word.chu_de_ten && (
                  <Text style={s.topic}>{word.chu_de_ten}</Text>
                )}
              </View>
              {!!audioMessage && (
                <Text accessibilityRole="alert" style={s.body}>
                  {audioMessage}
                </Text>
              )}
              <Text style={s.english}>{word.tu_tieng_anh}</Text>
              {user && (
                <Text style={s.phonetic}>
                  {word.tien_do?.da_hoc
                    ? "Ngăn Leitner " +
                      word.tien_do.ngan_leitner +
                      (word.tien_do.ngay_on_tap_tiep_theo
                        ? " · Ôn: " +
                          new Date(
                            word.tien_do.ngay_on_tap_tiep_theo,
                          ).toLocaleDateString("vi-VN")
                        : "")
                    : "Chưa học bằng flashcard"}
                </Text>
              )}
              {!!word.phien_am && (
                <Text style={s.phonetic}>{word.phien_am}</Text>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Nghe phát âm ${word.tu_tieng_anh}`}
                onPress={pronounce}
                style={s.speakButton}
              >
                <Feather name="volume-2" size={20} color="white" />
                <Text style={s.speakText}>Nghe phát âm</Text>
              </Pressable>
            </View>

            <View style={s.meaningCard}>
              <View style={s.sectionBody}>
                <Text style={s.label}>Nghĩa tiếng Việt</Text>
                <Text style={s.meaning}>{word.nghia_tieng_viet}</Text>
              </View>
            </View>

            <View style={s.section}>
              <Text style={s.sectionTitle}>Ví dụ sử dụng</Text>
              {word.vi_du.length ? (
                word.vi_du.map((example, index) => (
                  <View key={example.id} style={s.exampleCard}>
                    <View style={s.exampleNumber}>
                      <Text style={s.exampleNumberText}>{index + 1}</Text>
                    </View>
                    <View style={s.exampleBody}>
                      <Text style={s.exampleEnglish}>
                        {example.cau_tieng_anh}
                      </Text>
                      <Text style={s.exampleVietnamese}>
                        {example.cau_tieng_viet}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={s.noExample}>
                  <Feather name="message-circle" size={26} color={c.muted} />
                  <Text style={s.body}>Từ này chưa có câu ví dụ.</Text>
                </View>
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Message({
  title,
  body,
  action,
  onPress,
}: {
  title: string;
  body: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <View style={s.center}>
      <View style={s.emptyIcon}>
        <Feather name="book-open" size={34} color={c.green} />
      </View>
      <Text style={s.messageTitle}>{title}</Text>
      <Text style={s.body}>{body}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={s.retryButton}
      >
        <Text style={s.retryText}>{action}</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: c.background },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    maxWidth: 650,
    width: "100%",
    alignSelf: "center",
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    color: c.ink,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  content: {
    width: "100%",
    maxWidth: 650,
    alignSelf: "center",
    padding: 22,
    paddingBottom: 45,
    gap: 18,
  },
  hero: {
    padding: 25,
    borderRadius: 10,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    borderLeftWidth: 5,
    borderLeftColor: c.green,
    gap: 8,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: c.peach,
  },
  typeText: { color: c.ink, fontSize: 11, fontWeight: "800" },
  topic: {
    color: c.green,
    fontSize: 11,
    fontWeight: "700",
  },
  english: {
    color: c.ink,
    fontFamily: Fonts.serif,
    fontSize: 42,
    fontWeight: "700",
    marginTop: 12,
  },
  phonetic: { color: c.muted, fontSize: 16 },
  speakButton: {
    alignSelf: "flex-start",
    marginTop: 13,
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: c.green,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  speakText: { color: "white", fontSize: 14, fontWeight: "800" },
  meaningCard: {
    padding: 19,
    borderRadius: 10,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    flexDirection: "row",
    gap: 14,
  },
  sectionBody: { flex: 1, gap: 6 },
  label: {
    color: c.green,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  meaning: { color: c.ink, fontSize: 21, fontWeight: "700", lineHeight: 29 },
  section: { gap: 12 },
  sectionTitle: { color: c.ink, fontSize: 20, fontWeight: "800" },
  exampleCard: {
    padding: 17,
    borderRadius: 10,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    flexDirection: "row",
    gap: 13,
  },
  exampleNumber: {
    width: 31,
    height: 31,
    borderRadius: 11,
    backgroundColor: c.peach,
    alignItems: "center",
    justifyContent: "center",
  },
  exampleNumberText: { color: c.ink, fontSize: 12, fontWeight: "800" },
  exampleBody: { flex: 1, gap: 7 },
  exampleEnglish: {
    color: c.ink,
    fontFamily: Fonts.serif,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 23,
  },
  exampleVietnamese: { color: c.muted, fontSize: 14, lineHeight: 21 },
  noExample: {
    minHeight: 105,
    borderRadius: 10,
    backgroundColor: c.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  center: { paddingVertical: 70, alignItems: "center", gap: 14 },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 10,
    backgroundColor: c.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  messageTitle: {
    color: c.ink,
    fontSize: 21,
    fontWeight: "800",
    textAlign: "center",
  },
  body: { color: c.muted, fontSize: 14, lineHeight: 21, textAlign: "center" },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 8,
    backgroundColor: c.green,
  },
  retryText: { color: "white", fontWeight: "800" },
  inlineError: {
    color: c.danger,
    backgroundColor: "#FCECE8",
    padding: 15,
    borderRadius: 8,
  },
});
