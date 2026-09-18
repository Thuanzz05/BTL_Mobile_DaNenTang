import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { FlashcardPreview } from "@/components/flashcard-preview";
import { palette as c } from "@/constants/palette";
import { useAuth } from "@/contexts/auth-context";
import { getTopic, getWords, type Topic, type Word } from "@/services/catalog";

interface TopicProgress {
  total_words: number;
  learned_words: number;
  mastered_words: number;
}

export default function TopicScreen() {
  const params = useLocalSearchParams<{ topicId?: string }>();
  const topicId = Array.isArray(params.topicId)
    ? params.topicId[0]
    : params.topicId;
  const { client, ready, user } = useAuth();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [progress, setProgress] = useState<TopicProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [quizOpen, setQuizOpen] = useState(false);

  useEffect(() => {
    if (!topicId) return;
    let active = true;
    Promise.all([getTopic(topicId), getWords(topicId)])
      .then(([topicData, wordData]) => {
        if (!active) return;
        setTopic(topicData);
        setWords(wordData);
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
  }, [attempt, topicId]);

  useEffect(() => {
    if (!ready || !user || !topicId) return;
    let active = true;
    client
      .authorized<TopicProgress[]>(
        `/progress/topics?topicId=${encodeURIComponent(topicId)}`,
      )
      .then((items) => {
        if (active) setProgress(items[0] ?? null);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [client, ready, topicId, user]);

  const total = Number(topic?.word_count ?? words.length);
  const learned = Number(progress?.learned_words ?? 0);
  const percent = total
    ? Math.min(100, Math.round((learned / total) * 100))
    : 0;

  function startFlashcards() {
    if (!topic) return;
    router.push({
      pathname: "/study",
      params: { topicId: topic.id, topicName: topic.ten },
    });
  }

  return (
    <SafeAreaView style={s.page}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
      >
        <View style={s.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
            style={s.back}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={c.ink} />
          </Pressable>
          <Text style={s.headerTitle}>Chi tiết chủ đề</Text>
          <View style={s.headerSpace} />
        </View>

        {!topicId ? (
          <Message
            icon="alert-circle-outline"
            title="Không tìm thấy chủ đề"
            body="Hãy quay lại trang chủ và chọn một chủ đề khác."
            action="Về trang chủ"
            onPress={() => router.replace("/")}
          />
        ) : loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={c.green} />
            <Text style={s.body}>Đang chuẩn bị chủ đề…</Text>
          </View>
        ) : error || !topic ? (
          <Message
            icon="cloud-offline-outline"
            title="Chưa tải được chủ đề"
            body={error || "Chủ đề không tồn tại."}
            action="Thử lại"
            onPress={() => {
              setLoading(true);
              setError("");
              setAttempt((value) => value + 1);
            }}
          />
        ) : (
          <>
            <View style={s.hero}>
              <View style={s.heroIcon}>
                <Ionicons name="library-outline" size={34} color="white" />
              </View>
              <Text style={s.eyebrow}>CHỦ ĐỀ TỪ VỰNG</Text>
              <Text style={s.title}>{topic.ten}</Text>
              <Text style={s.description}>
                {topic.mo_ta ||
                  `Học ${total} từ vựng tiếng Anh thông dụng trong chủ đề ${topic.ten}.`}
              </Text>
              <View style={s.heroMeta}>
                <View style={s.metaItem}>
                  <Ionicons name="albums-outline" size={18} color="#DCECE4" />
                  <Text style={s.metaText}>{total} từ vựng</Text>
                </View>
                <View style={s.metaItem}>
                  <Ionicons name="time-outline" size={18} color="#DCECE4" />
                  <Text style={s.metaText}>
                    Khoảng {Math.max(3, Math.ceil(total / 4))} phút
                  </Text>
                </View>
              </View>
            </View>

            {user && (
              <View style={s.progressCard}>
                <View style={s.progressHeading}>
                  <View>
                    <Text style={s.cardLabel}>TIẾN ĐỘ CỦA BẠN</Text>
                    <Text style={s.progressTitle}>
                      {learned}/{total} từ đã học
                    </Text>
                  </View>
                  <Text style={s.percent}>{percent}%</Text>
                </View>
                <View
                  accessibilityRole="progressbar"
                  accessibilityValue={{ min: 0, max: total, now: learned }}
                  style={s.track}
                >
                  <View style={[s.fill, { width: `${percent}%` }]} />
                </View>
                <Text style={s.progressNote}>
                  {Number(progress?.mastered_words ?? 0)} từ đã ghi nhớ vững
                </Text>
              </View>
            )}

            <View style={s.section}>
              <Text style={s.sectionTitle}>Bạn muốn học thế nào?</Text>
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [s.modeCard, pressed && s.pressed]}
                onPress={startFlashcards}
              >
                <View style={s.modeIconPrimary}>
                  <Ionicons name="copy-outline" size={27} color="white" />
                </View>
                <View style={s.modeText}>
                  <Text style={s.modeTitle}>Học bằng flashcard</Text>
                  <Text style={s.modeBody}>
                    Lật thẻ xem nghĩa và nghe phát âm. Phần này không chấm đúng
                    sai.
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={21} color={c.green} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={total < 2}
                style={({ pressed }) => [
                  s.modeCard,
                  s.quizCard,
                  pressed && s.pressed,
                  total < 2 && s.disabled,
                ]}
                onPress={() => setQuizOpen(true)}
              >
                <View style={s.modeIconQuiz}>
                  <Ionicons
                    name="help-circle-outline"
                    size={28}
                    color="#8A5A2B"
                  />
                </View>
                <View style={s.modeText}>
                  <Text style={s.modeTitle}>Ôn tập trắc nghiệm</Text>
                  <Text style={s.modeBody}>
                    Kiểm tra nghĩa của từ. Từ trả lời sai sẽ xuất hiện lại.
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={21} color="#8A5A2B" />
              </Pressable>
            </View>

            {!!words.length && (
              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <Text style={s.sectionTitle}>Một vài từ trong chủ đề</Text>
                  <Text style={s.wordCount}>{total} từ</Text>
                </View>
                {words.slice(0, 4).map((word) => (
                  <View key={word.id} style={s.wordRow}>
                    <View style={s.wordNumber}>
                      <Ionicons name="leaf-outline" size={19} color={c.green} />
                    </View>
                    <View style={s.wordText}>
                      <Text style={s.word}>{word.tu_tieng_anh}</Text>
                      {!!word.phien_am && (
                        <Text style={s.phonetic}>{word.phien_am}</Text>
                      )}
                    </View>
                    <Text style={s.meaning} numberOfLines={1}>
                      {word.nghia_tieng_viet}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {quizOpen && topic && (
        <FlashcardPreview
          topic={topic}
          onClose={() => setQuizOpen(false)}
          onCompleted={() => setQuizOpen(false)}
        />
      )}
    </SafeAreaView>
  );
}

function Message({
  icon,
  title,
  body,
  action,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <View style={s.center}>
      <Ionicons name={icon} size={48} color={c.muted} />
      <Text style={s.messageTitle}>{title}</Text>
      <Text style={s.body}>{body}</Text>
      <Pressable accessibilityRole="button" style={s.primary} onPress={onPress}>
        <Text style={s.primaryText}>{action}</Text>
      </Pressable>
    </View>
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
  header: { flexDirection: "row", alignItems: "center" },
  back: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    color: c.ink,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  headerSpace: { width: 44 },
  hero: { padding: 25, borderRadius: 27, backgroundColor: c.green, gap: 13 },
  heroIcon: {
    width: 62,
    height: 62,
    borderRadius: 21,
    backgroundColor: "#397B62",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 3,
  },
  eyebrow: {
    color: "#CFE5D8",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  title: { color: "white", fontSize: 32, fontWeight: "800" },
  description: { color: "#DFEBE2", fontSize: 14, lineHeight: 22 },
  heroMeta: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 3 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 7 },
  metaText: { color: "#DCECE4", fontSize: 12, fontWeight: "600" },
  progressCard: {
    padding: 19,
    borderRadius: 21,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    gap: 12,
  },
  progressHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLabel: {
    color: c.green,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  progressTitle: { color: c.ink, fontSize: 17, fontWeight: "700" },
  percent: { color: c.green, fontSize: 23, fontWeight: "800" },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: c.soft,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 4, backgroundColor: c.green },
  progressNote: { color: c.muted, fontSize: 12 },
  section: { gap: 12 },
  sectionTitle: { color: c.ink, fontSize: 20, fontWeight: "700" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  wordCount: { color: c.muted, fontSize: 12 },
  modeCard: {
    padding: 17,
    minHeight: 105,
    borderRadius: 21,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  quizCard: { backgroundColor: c.peach, borderColor: "#EAD5B8" },
  modeIconPrimary: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: c.green,
    alignItems: "center",
    justifyContent: "center",
  },
  modeIconQuiz: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: "#F2DDBE",
    alignItems: "center",
    justifyContent: "center",
  },
  modeText: { flex: 1, gap: 5 },
  modeTitle: { color: c.ink, fontSize: 16, fontWeight: "700" },
  modeBody: { color: c.muted, fontSize: 13, lineHeight: 20 },
  body: { color: c.muted, fontSize: 13, lineHeight: 20, textAlign: "center" },
  pressed: { opacity: 0.68 },
  disabled: { opacity: 0.45 },
  wordRow: {
    padding: 14,
    borderRadius: 17,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  wordNumber: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: c.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  wordText: { flex: 1, gap: 2 },
  word: { color: c.ink, fontSize: 16, fontWeight: "700" },
  phonetic: { color: c.muted, fontSize: 11 },
  meaning: { maxWidth: "38%", color: c.ink, fontSize: 13, textAlign: "right" },
  center: {
    minHeight: 520,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  messageTitle: {
    color: c.ink,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  primary: {
    minHeight: 52,
    minWidth: 180,
    paddingHorizontal: 22,
    borderRadius: 15,
    backgroundColor: c.green,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: "white", fontSize: 15, fontWeight: "700" },
});
