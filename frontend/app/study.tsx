import { FlashcardPreview } from "@/components/flashcard-preview";
import { palette as c } from "@/constants/palette";
import { getWords, Topic, Word } from "@/services/catalog";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Speech from "expo-speech";
import { useEffect, useState } from "react";
import { useReducedMotion } from "react-native-reanimated";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

export default function StudyScreen() {
  const params = useLocalSearchParams<{
    topicId?: string;
    topicName?: string;
  }>();
  const topicId = Array.isArray(params.topicId)
    ? params.topicId[0]
    : params.topicId;
  const topicName = Array.isArray(params.topicName)
    ? params.topicName[0]
    : params.topicName || "Từ vựng";
  const [words, setWords] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [finished, setFinished] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const reduceMotion = useReducedMotion();
  const [flip] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!topicId) return;
    let active = true;
    getWords(topicId)
      .then((data) => {
        if (active) setWords(data);
      })
      .catch((failure) => {
        if (active) setError((failure as Error).message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      void Speech.stop();
    };
  }, [attempt, topicId]);

  const word = words[index];
  const message = !topicId
    ? "Không tìm thấy chủ đề."
    : error || "Chủ đề chưa có từ vựng.";
  const topic: Topic | null = topicId
    ? { id: topicId, ten: topicName, mo_ta: null, word_count: words.length }
    : null;
  const progress = words.length ? ((index + 1) / words.length) * 100 : 0;
  const frontRotation = flip.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });
  const backRotation = flip.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });

  function pronounce() {
    if (!word) return;
    void Speech.stop().then(() =>
      Speech.speak(word.tu_tieng_anh, { language: "en-US", rate: 0.82 }),
    );
  }

  function flipCard() {
    const nextValue = flipped ? 0 : 1;
    setFlipped(!flipped);
    Animated.timing(flip, {
      toValue: nextValue,
      duration: reduceMotion ? 0 : 420,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }

  function resetFlip() {
    flip.stopAnimation();
    flip.setValue(0);
    setFlipped(false);
  }

  function previous() {
    if (index === 0) return;
    setIndex(index - 1);
    resetFlip();
  }

  function next() {
    if (index === words.length - 1) {
      setFinished(true);
      return;
    }
    setIndex(index + 1);
    resetFlip();
  }

  return (
    <SafeAreaView style={s.page}>
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Về trang chủ"
            style={s.iconButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={23} color={c.ink} />
          </Pressable>
          <View style={s.headerCopy}>
            <Text style={s.eyebrow}>HỌC FLASHCARD</Text>
            <Text style={s.topic}>{topicName}</Text>
          </View>
          {!!words.length && (
            <Text style={s.counter}>
              {index + 1}/{words.length}
            </Text>
          )}
        </View>

        {loading && topicId ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={c.green} />
            <Text style={s.muted}>Đang chuẩn bị bộ thẻ…</Text>
          </View>
        ) : error || !word ? (
          <View style={s.center}>
            <Ionicons name="cloud-offline-outline" size={48} color={c.muted} />
            <Text accessibilityRole="alert" style={s.title}>
              {message}
            </Text>
            <Pressable
              accessibilityRole="button"
              style={s.primary}
              onPress={() => {
                if (!topicId) return router.replace("/");
                setLoading(true);
                setError("");
                setAttempt((value) => value + 1);
              }}
            >
              <Text style={s.primaryText}>
                {topicId ? "Thử lại" : "Về trang chủ"}
              </Text>
            </Pressable>
          </View>
        ) : finished ? (
          <View style={s.finish}>
            <View style={s.finishIcon}>
              <Ionicons name="checkmark" size={36} color="white" />
            </View>
            <Text style={s.eyebrow}>HOÀN THÀNH PHẦN HỌC</Text>
            <Text style={s.finishTitle}>
              Bạn đã xem hết {words.length} flashcard.
            </Text>
            <Text style={s.muted}>
              Bây giờ hãy ôn bằng trắc nghiệm. Từ trả lời sai sẽ tự quay lại sau
              vài câu.
            </Text>
            <Pressable
              accessibilityRole="button"
              style={s.primary}
              onPress={() => setQuizOpen(true)}
            >
              <Text style={s.primaryText}>Ôn tập trắc nghiệm</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={s.secondary}
              onPress={() => {
                setFinished(false);
                setIndex(0);
                resetFlip();
              }}
            >
              <Text style={s.secondaryText}>Xem lại flashcard</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={s.track}>
              <View style={[s.fill, { width: `${progress}%` }]} />
            </View>
            <View style={s.stageLabel}>
              <Text style={s.muted}>
                {flipped ? "Mặt sau · Nghĩa" : "Mặt trước · Từ mới"}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Nghe phát âm ${word.tu_tieng_anh}`}
                style={s.speaker}
                onPress={pronounce}
              >
                <Ionicons name="volume-high" size={20} color={c.green} />
                <Text style={s.speakerText}>Phát âm</Text>
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                flipped ? "Lật về mặt từ tiếng Anh" : "Lật thẻ để xem nghĩa"
              }
              style={({ pressed }) => [s.cardFrame, pressed && s.cardPressed]}
              onPress={flipCard}
            >
              <Animated.View
                pointerEvents="none"
                accessibilityElementsHidden={flipped}
                importantForAccessibility={
                  flipped ? "no-hide-descendants" : "auto"
                }
                style={[
                  s.card,
                  {
                    transform: [
                      { perspective: 1000 },
                      { rotateY: frontRotation },
                    ],
                  },
                ]}
              >
                <View style={s.cardTop}>
                  <Text style={s.cardNumber}>
                    {String(index + 1).padStart(2, "0")}
                  </Text>
                  <Ionicons name="sync-outline" size={21} color={c.muted} />
                </View>
                <View style={s.cardBody}>
                  <Text style={s.cardLabel}>
                    {wordTypes[word.loai_tu] || word.loai_tu}
                  </Text>
                  <Text style={s.english}>{word.tu_tieng_anh}</Text>
                  {!!word.phien_am && (
                    <Text style={s.phonetic}>{word.phien_am}</Text>
                  )}
                  <View style={s.play}>
                    <Ionicons name="volume-high" size={24} color="white" />
                  </View>
                </View>
                <Text style={s.flipHint}>Chạm vào thẻ để lật</Text>
              </Animated.View>
              <Animated.View
                pointerEvents="none"
                accessibilityElementsHidden={!flipped}
                importantForAccessibility={
                  flipped ? "auto" : "no-hide-descendants"
                }
                style={[
                  s.card,
                  s.cardBack,
                  {
                    transform: [
                      { perspective: 1000 },
                      { rotateY: backRotation },
                    ],
                  },
                ]}
              >
                <View style={s.cardTop}>
                  <Text style={[s.cardNumber, s.cardNumberBack]}>
                    {String(index + 1).padStart(2, "0")}
                  </Text>
                  <Ionicons name="sync-outline" size={21} color="#8A5A2B" />
                </View>
                <View style={s.cardBody}>
                  <Text style={[s.cardLabel, s.cardLabelBack]}>
                    NGHĨA TIẾNG VIỆT
                  </Text>
                  <Text style={s.meaning}>{word.nghia_tieng_viet}</Text>
                  <View style={s.rule} />
                  <Text style={s.englishSmall}>{word.tu_tieng_anh}</Text>
                  {!!word.phien_am && (
                    <Text style={s.phonetic}>{word.phien_am}</Text>
                  )}
                </View>
                <Text style={[s.flipHint, s.flipHintBack]}>
                  Chạm vào thẻ để lật lại
                </Text>
              </Animated.View>
            </Pressable>

            <View style={s.tip}>
              <Ionicons name="eye-outline" size={19} color={c.green} />
              <Text style={s.tipText}>
                Hãy đoán nghĩa trước khi lật thẻ. Phần này không chấm đúng sai.
              </Text>
            </View>
            <View style={s.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: index === 0 }}
                disabled={index === 0}
                style={[s.previous, index === 0 && s.disabled]}
                onPress={previous}
              >
                <Ionicons name="arrow-back" size={20} color={c.ink} />
                <Text style={s.previousText}>Trước</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={s.next}
                onPress={next}
              >
                <Text style={s.primaryText}>
                  {index === words.length - 1 ? "Học xong" : "Thẻ tiếp theo"}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
      {quizOpen && topic && (
        <FlashcardPreview
          topic={topic}
          onClose={() => router.replace("/")}
          onCompleted={() => undefined}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: c.background },
  content: {
    width: "100%",
    maxWidth: 620,
    alignSelf: "center",
    padding: 22,
    paddingBottom: 36,
    gap: 18,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerCopy: { flex: 1, gap: 3 },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.surface,
  },
  eyebrow: {
    color: c.green,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  topic: { color: c.ink, fontSize: 18, fontWeight: "700" },
  counter: {
    color: c.green,
    fontWeight: "800",
    backgroundColor: c.soft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  center: {
    minHeight: 500,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    paddingHorizontal: 24,
  },
  title: {
    color: c.ink,
    fontSize: 21,
    lineHeight: 29,
    fontWeight: "700",
    textAlign: "center",
  },
  muted: { color: c.muted, fontSize: 14, lineHeight: 22, textAlign: "center" },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: c.line,
  },
  fill: { height: "100%", borderRadius: 3, backgroundColor: c.green },
  stageLabel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  speaker: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 8,
  },
  speakerText: { color: c.green, fontSize: 13, fontWeight: "700" },
  cardFrame: { minHeight: 430, position: "relative" },
  card: {
    ...StyleSheet.absoluteFill,
    minHeight: 430,
    padding: 24,
    borderRadius: 28,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    justifyContent: "space-between",
    backfaceVisibility: "hidden",
  },
  cardBack: { backgroundColor: c.peach, borderColor: "#EAD5B8" },
  cardPressed: { transform: [{ scale: 0.985 }] },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardNumber: {
    color: c.muted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  cardNumberBack: { color: "#8A5A2B" },
  cardBody: { alignItems: "center", gap: 14, paddingHorizontal: 10 },
  cardLabel: {
    color: c.green,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  cardLabelBack: { color: "#8A5A2B" },
  english: {
    color: c.ink,
    fontSize: 46,
    lineHeight: 56,
    fontWeight: "800",
    letterSpacing: -1.5,
    textAlign: "center",
  },
  englishSmall: { color: c.ink, fontSize: 22, fontWeight: "700" },
  meaning: {
    color: c.ink,
    fontSize: 31,
    lineHeight: 42,
    fontWeight: "700",
    textAlign: "center",
  },
  phonetic: { color: c.muted, fontSize: 17 },
  play: {
    width: 56,
    height: 56,
    marginTop: 8,
    borderRadius: 18,
    backgroundColor: c.green,
    alignItems: "center",
    justifyContent: "center",
  },
  rule: { width: 48, height: 2, marginVertical: 5, backgroundColor: c.line },
  flipHint: { color: c.muted, fontSize: 12, textAlign: "center" },
  flipHintBack: { color: "#7A674F" },
  tip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 8,
  },
  tipText: { flex: 1, color: c.muted, fontSize: 12, lineHeight: 19 },
  actions: { flexDirection: "row", gap: 12 },
  previous: {
    minHeight: 54,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  previousText: { color: c.ink, fontSize: 15, fontWeight: "700" },
  next: {
    flex: 1,
    minHeight: 54,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: c.green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  disabled: { opacity: 0.38 },
  primary: {
    minHeight: 54,
    width: "100%",
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: c.green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  primaryText: { color: "white", fontSize: 15, fontWeight: "800" },
  secondary: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: c.green, fontSize: 14, fontWeight: "700" },
  finish: {
    minHeight: 520,
    padding: 30,
    borderRadius: 28,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
  },
  finishIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: c.green,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  finishTitle: {
    color: c.ink,
    fontSize: 28,
    lineHeight: 37,
    fontWeight: "800",
    letterSpacing: -0.7,
    textAlign: "center",
  },
});
