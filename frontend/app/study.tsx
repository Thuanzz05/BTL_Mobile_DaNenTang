import { Fonts } from "@/constants/theme";
import { palette as c } from "@/constants/palette";
import { useAuth } from "@/contexts/auth-context";
import { getWords, Word } from "@/services/catalog";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { usePronunciation } from "@/hooks/use-pronunciation";
import { useEffect, useState } from "react";
import { useReducedMotion } from "react-native-reanimated";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
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

const studyColors = {
  canvas: c.background,
  paper: c.surface,
  ink: c.ink,
  muted: c.muted,
  blue: c.green,
  paleBlue: c.soft,
  line: c.line,
  rust: c.rust,
};

export default function StudyScreen() {
  const { ready, user } = useAuth();
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
  if (!ready)
    return (
      <SafeAreaView style={s.page}>
        <ActivityIndicator color={studyColors.blue} />
      </SafeAreaView>
    );
  return (
    <StudyCards
      key={(user?.id || "guest") + ":" + topicId}
      topicId={topicId}
      topicName={topicName}
    />
  );
}

function StudyCards({
  topicId,
  topicName,
}: {
  topicId?: string;
  topicName: string;
}) {
  const { client, user } = useAuth();
  const userId = user?.id;
  const [words, setWords] = useState<(Word & { da_xem_luc?: string })[]>([]);
  const [sessionId, setSessionId] = useState<string>();
  const [seen, setSeen] = useState<Set<string>>(() => new Set());
  const [saved, setSaved] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [completed, setCompleted] = useState(false);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const reduceMotion = useReducedMotion();
  const [flip] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!topicId) return;
    let active = true;
    const request = userId
      ? client.authorized<{
          phien_hoc_tap_id: string;
          danh_sach_tu: (Word & { da_xem_luc?: string })[];
        }>("/learning/flashcards/start", {
          method: "POST",
          body: JSON.stringify({ chu_de_id: topicId }),
        })
      : getWords(topicId).then((data) => ({
          phien_hoc_tap_id: undefined,
          danh_sach_tu: (data as (Word & { da_xem_luc?: string })[]).slice(
            0,
            5,
          ),
        }));
    request
      .then((data) => {
        if (!active) return;
        setWords(data.danh_sach_tu);
        setSessionId(data.phien_hoc_tap_id);
        const viewed = new Set(
          data.danh_sach_tu
            .filter((item) => item.da_xem_luc)
            .map((item) => item.id),
        );
        setSeen(viewed);
        const nextIndex = data.danh_sach_tu.findIndex(
          (item) => !viewed.has(item.id),
        );
        setIndex(
          nextIndex < 0 ? Math.max(0, data.danh_sach_tu.length - 1) : nextIndex,
        );
        flip.setValue(0);
        setFlipped(false);
      })
      .catch((failure) => {
        if (active) setError((failure as Error).message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt, client, topicId, userId, flip]);

  const word = words[index];
  const { pronounce, audioMessage } = usePronunciation(
    word?.tu_tieng_anh,
    word?.url_am_thanh,
  );
  const message = !topicId
    ? "Không tìm thấy chủ đề."
    : error || "Chủ đề chưa có từ vựng.";
  const progress = words.length ? ((index + 1) / words.length) * 100 : 0;
  const frontRotation = flip.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });
  const backRotation = flip.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });

  function flipCard() {
    const nextValue = flipped ? 0 : 1;
    setFlipped(!flipped);
    if (!flipped && word) setSeen((current) => new Set(current).add(word.id));
    Animated.timing(flip, {
      toValue: nextValue,
      duration: reduceMotion ? 0 : 420,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }

  function resetFlip() {
    flip.stopAnimation();
    flip.setValue(0);
    setFlipped(false);
  }

  function previous() {
    if (index === 0 || busy) return;
    setIndex(index - 1);
    resetFlip();
  }

  async function next() {
    if (!word || busy || !seen.has(word.id)) return;
    setBusy(true);
    setSaveError("");
    try {
      if (sessionId && !completed) {
        await client.authorized("/learning/flashcards/view", {
          method: "POST",
          body: JSON.stringify({
            phien_hoc_tap_id: sessionId,
            tu_vung_id: word.id,
          }),
        });
        if (index === words.length - 1) {
          await client.authorized("/learning/flashcards/complete", {
            method: "POST",
            body: JSON.stringify({ phien_hoc_tap_id: sessionId }),
          });
          setCompleted(true);
        }
      }
      if (index === words.length - 1) setFinished(true);
      else {
        setIndex(index + 1);
        resetFlip();
      }
    } catch (failure) {
      setSaveError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function saveWord() {
    if (!word || busy) return;
    setBusy(true);
    setSaveError("");
    try {
      await client.authorized("/favorites/" + word.id, { method: "PUT" });
      setSaved((current) => new Set(current).add(word.id));
    } catch (failure) {
      setSaveError((failure as Error).message);
    } finally {
      setBusy(false);
    }
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
            <Feather name="arrow-left" size={22} color={studyColors.ink} />
          </Pressable>
          <View style={s.headerCopy}>
            <Text style={s.eyebrow}>Học bằng flashcard</Text>
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
            <ActivityIndicator size="large" color={studyColors.blue} />
            <Text style={s.muted}>Đang chuẩn bị bộ thẻ…</Text>
          </View>
        ) : error || !word ? (
          <View style={s.center}>
            <Feather name="wifi-off" size={48} color={studyColors.muted} />
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
              <Feather name="check" size={34} color="white" />
            </View>
            <Text style={s.eyebrow}>Hoàn thành phần học</Text>
            <Text style={s.finishTitle}>
              Bạn đã xem hết {words.length} flashcard.
            </Text>
            <Text style={s.muted}>
              {user
                ? "Đã lưu phiên học. Từ mới ở ngăn 1, đến hạn ôn sau 1 ngày. Bạn có thể ôn các từ khác đã đến hạn."
                : "Đây là lượt học thử nên kết quả không được lưu. Đăng nhập để ôn trắc nghiệm và theo dõi tiến độ."}
            </Text>
            {user ? (
              <Pressable
                accessibilityRole="button"
                style={s.primary}
                onPress={() => router.replace("/(tabs)/explore")}
              >
                <Text style={s.primaryText}>Xem từ đến hạn</Text>
                <Feather name="arrow-right" size={20} color="white" />
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                style={s.primary}
                onPress={() => router.push("/login")}
              >
                <Text style={s.primaryText}>Đăng nhập để ôn tập</Text>
                <Feather name="log-in" size={19} color="white" />
              </Pressable>
            )}
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
            <Text style={s.sessionNote}>
              {user
                ? "Các thẻ đã xem được lưu khi bấm Tiếp theo. Học hết phiên để ghi nhận từ mới vào ngăn 1."
                : "Học thử tối đa 5 từ. Kết quả không được lưu."}
            </Text>
            <View style={s.track}>
              <View style={[s.fill, { width: `${progress}%` }]} />
            </View>
            <View style={s.stageLabel}>
              <Text style={s.stageText}>
                {flipped ? "Nghĩa tiếng Việt" : "Từ tiếng Anh"}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Nghe phát âm ${word.tu_tieng_anh}`}
                style={s.speaker}
                onPress={pronounce}
              >
                <Feather name="volume-2" size={20} color={studyColors.blue} />
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
                  <Text style={s.cardAction}>Lật để xem nghĩa</Text>
                </View>
                <View style={s.cardBody}>
                  <Text style={s.cardLabel}>
                    {wordTypes[word.loai_tu] || word.loai_tu}
                  </Text>
                  <Text style={s.english}>{word.tu_tieng_anh}</Text>
                  {!!word.phien_am && (
                    <Text style={s.phonetic}>{word.phien_am}</Text>
                  )}
                </View>
                <Text style={s.flipHint}>Chạm vào bất kỳ đâu trên thẻ</Text>
              </Animated.View>
              <Animated.View
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
                  <Text style={[s.cardAction, s.cardActionBack]}>
                    Mặt nghĩa
                  </Text>
                </View>
                <View style={s.cardBody}>
                  <Text style={[s.cardLabel, s.cardLabelBack]}>
                    {wordTypes[word.loai_tu] || word.loai_tu}
                  </Text>
                  <Text style={s.meaning}>{word.nghia_tieng_viet}</Text>
                  <View style={s.rule} />
                  <Text style={s.englishSmall}>{word.tu_tieng_anh}</Text>
                  {!!word.phien_am && (
                    <Text style={s.phonetic}>{word.phien_am}</Text>
                  )}
                  {word.vi_du?.map((example) => (
                    <View key={example.id} style={s.example}>
                      <Text style={s.exampleLabel}>Trong câu</Text>
                      <Text style={s.exampleEnglish}>
                        {example.cau_tieng_anh}
                      </Text>
                      <Text style={s.exampleVietnamese}>
                        {example.cau_tieng_viet}
                      </Text>
                    </View>
                  ))}
                </View>
                <Text style={[s.flipHint, s.flipHintBack]}>
                  Chạm vào thẻ để lật lại
                </Text>
              </Animated.View>
            </Pressable>

            {!!audioMessage && (
              <Text accessibilityRole="alert" style={s.muted}>
                {audioMessage}
              </Text>
            )}
            <View style={s.tip}>
              <Text style={s.tipText}>
                Hãy đoán nghĩa trước khi lật. Phần học này không chấm điểm.
              </Text>
            </View>
            {user && (
              <Pressable
                accessibilityRole="button"
                disabled={busy || saved.has(word.id)}
                style={s.secondary}
                onPress={saveWord}
              >
                <Text style={s.secondaryText}>
                  {saved.has(word.id)
                    ? "Đã thêm vào yêu thích"
                    : "Thêm từ vào yêu thích"}
                </Text>
              </Pressable>
            )}
            {!!saveError && (
              <Text accessibilityRole="alert" style={s.muted}>
                {saveError} Bấm lại để thử lưu.
              </Text>
            )}
            <View style={s.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: index === 0 }}
                disabled={index === 0 || busy}
                style={[s.previous, index === 0 && s.disabled]}
                onPress={previous}
              >
                <Feather name="arrow-left" size={19} color={studyColors.ink} />
                <Text style={s.previousText}>Trước</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={[s.next, (busy || !seen.has(word.id)) && s.disabled]}
                disabled={busy || !seen.has(word.id)}
                onPress={next}
              >
                <Text style={s.primaryText}>
                  {busy
                    ? "Đang lưu…"
                    : !seen.has(word.id)
                      ? "Lật thẻ để học"
                      : index === words.length - 1
                        ? "Học xong"
                        : "Thẻ tiếp theo"}
                </Text>
                <Feather name="arrow-right" size={20} color="white" />
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: studyColors.canvas },
  content: {
    width: "100%",
    maxWidth: 580,
    alignSelf: "center",
    padding: 20,
    paddingBottom: 36,
    gap: 15,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: studyColors.line,
  },
  headerCopy: { flex: 1, gap: 2 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    color: studyColors.blue,
    fontSize: 12,
    fontWeight: "600",
  },
  topic: { color: studyColors.ink, fontSize: 19, fontWeight: "700" },
  counter: {
    color: studyColors.muted,
    fontSize: 14,
    fontWeight: "600",
  },
  center: {
    minHeight: 500,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    paddingHorizontal: 24,
  },
  title: {
    color: studyColors.ink,
    fontSize: 21,
    lineHeight: 29,
    fontWeight: "700",
    textAlign: "center",
  },
  muted: {
    color: studyColors.muted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
  sessionNote: { color: studyColors.muted, fontSize: 13, lineHeight: 20 },
  track: {
    height: 3,
    overflow: "hidden",
    backgroundColor: studyColors.line,
  },
  fill: { height: "100%", backgroundColor: studyColors.blue },
  stageLabel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stageText: { color: studyColors.muted, fontSize: 13 },
  speaker: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 4,
  },
  speakerText: { color: studyColors.blue, fontSize: 13, fontWeight: "700" },
  cardFrame: { minHeight: 410, position: "relative" },
  card: {
    ...StyleSheet.absoluteFill,
    minHeight: 410,
    padding: 26,
    borderRadius: 10,
    backgroundColor: studyColors.paper,
    borderWidth: 1,
    borderColor: studyColors.line,
    borderLeftWidth: 5,
    borderLeftColor: studyColors.blue,
    justifyContent: "space-between",
    backfaceVisibility: "hidden",
  },
  cardBack: {
    position: "relative",
    gap: 22,
    backgroundColor: studyColors.paleBlue,
    borderColor: "#BDD0D6",
    borderLeftColor: studyColors.rust,
  },
  cardPressed: { transform: [{ scale: 0.985 }] },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardNumber: {
    color: studyColors.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  cardNumberBack: { color: studyColors.rust },
  cardAction: { color: studyColors.muted, fontSize: 12 },
  cardActionBack: { color: studyColors.rust },
  cardBody: { alignItems: "flex-start", gap: 13, paddingHorizontal: 4 },
  cardLabel: {
    color: studyColors.blue,
    fontSize: 13,
    fontWeight: "600",
  },
  cardLabelBack: { color: studyColors.rust },
  english: {
    color: studyColors.ink,
    fontFamily: Fonts.serif,
    fontSize: 52,
    lineHeight: 62,
    fontWeight: "700",
    letterSpacing: -1.2,
  },
  englishSmall: {
    color: studyColors.ink,
    fontFamily: Fonts.serif,
    fontSize: 23,
    fontWeight: "700",
  },
  meaning: {
    color: studyColors.ink,
    fontSize: 32,
    lineHeight: 41,
    fontWeight: "700",
  },
  phonetic: { color: studyColors.muted, fontSize: 17 },
  rule: {
    width: "100%",
    height: 1,
    marginVertical: 4,
    backgroundColor: "#BDD0D6",
  },
  example: {
    width: "100%",
    gap: 6,
    marginTop: 5,
    paddingLeft: 14,
    borderLeftWidth: 2,
    borderLeftColor: studyColors.rust,
  },
  exampleLabel: {
    color: studyColors.rust,
    fontSize: 12,
    fontWeight: "600",
  },
  exampleEnglish: {
    color: studyColors.ink,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
  },
  exampleVietnamese: {
    color: studyColors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  flipHint: { color: studyColors.muted, fontSize: 12 },
  flipHintBack: { color: studyColors.rust },
  tip: {
    paddingLeft: 14,
    borderLeftWidth: 2,
    borderLeftColor: studyColors.line,
  },
  tipText: { color: studyColors.muted, fontSize: 12, lineHeight: 19 },
  actions: { flexDirection: "row", gap: 12 },
  previous: {
    minHeight: 54,
    paddingHorizontal: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: studyColors.line,
    backgroundColor: studyColors.paper,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  previousText: { color: studyColors.ink, fontSize: 15, fontWeight: "700" },
  next: {
    flex: 1,
    minHeight: 54,
    paddingHorizontal: 18,
    borderRadius: 9,
    backgroundColor: studyColors.blue,
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
    borderRadius: 9,
    backgroundColor: studyColors.blue,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  primaryText: { color: "white", fontSize: 15, fontWeight: "700" },
  secondary: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: studyColors.blue, fontSize: 14, fontWeight: "700" },
  finish: {
    minHeight: 520,
    padding: 30,
    borderRadius: 10,
    backgroundColor: studyColors.paper,
    borderWidth: 1,
    borderColor: studyColors.line,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
  },
  finishIcon: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: studyColors.blue,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  finishTitle: {
    color: studyColors.ink,
    fontSize: 28,
    lineHeight: 37,
    fontWeight: "800",
    letterSpacing: -0.7,
    textAlign: "center",
  },
});
