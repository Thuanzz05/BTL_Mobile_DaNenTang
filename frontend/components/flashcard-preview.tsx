import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { palette as c } from "@/constants/palette";
import { getWords, Topic, Word } from "@/services/catalog";
import {
  answerQuiz,
  choicesFor,
  createQuiz,
  nextQuestion,
  requestId,
} from "@/services/quiz";
import { useAuth } from "@/contexts/auth-context";

interface QuizChoice {
  id: string;
  noi_dung: string;
}

interface QuizQuestion {
  id: string;
  tu_vung_id: string;
  tu_tieng_anh: string;
  phien_am: string | null;
  lua_chon: QuizChoice[];
}

interface QuizSession {
  phien_hoc_tap_id: string;
  trang_thai: "dang-hoc" | "hoan-thanh" | "bo-do";
  tong_so_tu: number;
  so_tu_hoan_thanh: number;
  so_luot_tra_loi: number;
  so_luot_dung: number;
  ty_le_dung: number | null;
  cau_hoi: QuizQuestion | null;
}

interface AnswerResponse {
  ket_qua: {
    dung: boolean;
    dap_an_dung_id: string;
    nghia_tieng_viet: string;
    tu_da_hoan_thanh: boolean;
  };
  phien: QuizSession;
}

const post = (body: unknown): RequestInit => ({
  method: "POST",
  body: JSON.stringify(body),
});

export function FlashcardPreview({
  topic,
  reviewCount = 0,
  onClose,
  onCompleted,
}: {
  topic: Topic | null;
  reviewCount?: number;
  onClose: () => void;
  onCompleted: () => void;
}) {
  const { client, ready, user } = useAuth();
  const [words, setWords] = useState<Word[] | null>(null);
  const [serverSession, setServerSession] = useState<QuizSession | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const visible = !!topic || reviewCount > 0;
  useEffect(() => {
    if (!visible || !ready) return;
    let active = true;
    const request: Promise<QuizSession | Word[]> = reviewCount
      ? client.authorized(
          "/quiz/review/start",
          post({ tong_so_tu: Math.min(20, reviewCount) }),
        )
      : user && topic
        ? client.authorized(
            "/quiz/start",
            post({
              chu_de_id: topic.id,
              tong_so_tu: Math.min(20, Math.max(5, Number(topic.word_count))),
            }),
          )
        : getWords(topic!.id);
    request
      .then((data) => {
        if (!active) return;
        if (Array.isArray(data)) {
          setWords(data);
        } else {
          setServerSession(data);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [attempt, client, ready, reviewCount, topic, user, visible]);
  const enough =
    words && new Set(words.map((w) => w.nghia_tieng_viet.trim())).size >= 2;
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={s.page}>
        {serverSession ? (
          <ServerQuiz
            key={serverSession.phien_hoc_tap_id}
            initial={serverSession}
            title={reviewCount ? "Ôn tập hôm nay" : topic?.ten || "Từ vựng"}
            onClose={onClose}
            onCompleted={onCompleted}
          />
        ) : enough ? (
          <Quiz
            key={attempt}
            words={words}
            title={reviewCount ? "Ôn tập hôm nay" : topic?.ten || "Từ vựng"}
            onClose={onClose}
          />
        ) : (
          <View style={s.loading}>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={s.close}
            >
              <Text style={s.link}>Về trang chủ</Text>
            </Pressable>
            {error ? (
              <>
                <Text accessibilityRole="alert" style={s.body}>
                  {error}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  style={s.button}
                  onPress={() => {
                    setError("");
                    setAttempt((v) => v + 1);
                  }}
                >
                  <Text style={s.white}>Thử lại</Text>
                </Pressable>
              </>
            ) : words ? (
              <>
                <Ionicons name="library-outline" size={48} color={c.green} />
                <Text style={s.title}>Chủ đề đang được bổ sung</Text>
                <Text style={s.body}>
                  Cần ít nhất 2 từ có nghĩa khác nhau để tạo câu hỏi. Hãy chọn
                  chủ đề khác nhé.
                </Text>
              </>
            ) : (
              <ActivityIndicator size="large" color={c.green} />
            )}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

function ServerQuiz({
  initial,
  title,
  onClose,
  onCompleted,
}: {
  initial: QuizSession;
  title: string;
  onClose: () => void;
  onCompleted: () => void;
}) {
  const { client } = useAuth();
  const [session, setSession] = useState(initial);
  const [nextSession, setNextSession] = useState<QuizSession | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<AnswerResponse["ket_qua"] | null>(
    null,
  );
  const [pending, setPending] = useState<{
    questionId: string;
    choiceId: string;
    id: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmExit, setConfirmExit] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(() => new Set());
  const question = session.cau_hoi;
  const progress = session.tong_so_tu
    ? (session.so_tu_hoan_thanh / session.tong_so_tu) * 100
    : 0;

  async function answer(choiceId: string) {
    if (!question || busy || feedback) return;
    const request =
      pending?.questionId === question.id && pending.choiceId === choiceId
        ? pending
        : { questionId: question.id, choiceId, id: requestId() };
    setPending(request);
    setSelected(choiceId);
    setBusy(true);
    setError("");
    try {
      const response = await client.authorized<AnswerResponse>(
        `/quiz/${session.phien_hoc_tap_id}/answers`,
        post({
          cau_hoi_id: request.questionId,
          lua_chon_id: request.choiceId,
          ma_yeu_cau: request.id,
        }),
      );
      setFeedback(response.ket_qua);
      setNextSession(response.phien);
      setPending(null);
      if (response.phien.trang_thai === "hoan-thanh") onCompleted();
    } catch (answerError) {
      setError((answerError as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function next() {
    if (!nextSession) return;
    setSession(nextSession);
    setNextSession(null);
    setSelected(null);
    setFeedback(null);
    setError("");
  }

  async function stop() {
    setBusy(true);
    setError("");
    try {
      await client.authorized(`/quiz/${session.phien_hoc_tap_id}/stop`, {
        method: "POST",
      });
      onClose();
    } catch (stopError) {
      setError((stopError as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function saveWord() {
    if (!question || saved.has(question.tu_vung_id)) return;
    setBusy(true);
    setError("");
    try {
      await client.authorized(`/favorites/${question.tu_vung_id}`, {
        method: "PUT",
      });
      setSaved((current) => new Set(current).add(question.tu_vung_id));
    } catch (saveError) {
      setError((saveError as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Thoát bài học"
          style={s.close}
          onPress={() => setConfirmExit(true)}
        >
          <Ionicons name="close" size={24} color={c.ink} />
        </Pressable>
        <View style={s.headerText}>
          <Text style={s.overline}>ÔN TẬP TRẮC NGHIỆM</Text>
          <Text style={s.topic}>{title}</Text>
        </View>
        <View style={s.counter}>
          <Ionicons name="layers-outline" size={17} color={c.green} />
          <Text style={s.link}>
            {session.so_tu_hoan_thanh}/{session.tong_so_tu}
          </Text>
        </View>
      </View>
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: progress }}
        style={s.track}
      >
        <View style={[s.fill, { width: `${progress}%` }]} />
      </View>

      {confirmExit ? (
        <View style={s.card}>
          <Text style={s.title}>Dừng bài học này?</Text>
          <Text style={s.body}>
            Các lượt đã trả lời vẫn được giữ trong lịch sử.
          </Text>
          {!!error && <Text style={s.error}>{error}</Text>}
          <Pressable
            accessibilityRole="button"
            style={s.button}
            disabled={busy}
            onPress={() => setConfirmExit(false)}
          >
            <Text style={s.white}>Tiếp tục học</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={s.close}
            disabled={busy}
            onPress={stop}
          >
            {busy ? (
              <ActivityIndicator color={c.green} />
            ) : (
              <Text style={s.link}>Dừng phiên</Text>
            )}
          </Pressable>
        </View>
      ) : session.trang_thai === "hoan-thanh" || !question ? (
        <View style={s.card}>
          <Ionicons name="checkmark-circle" size={64} color={c.green} />
          <Text style={s.title}>Bạn đã hoàn thành!</Text>
          <Text style={s.body}>{session.so_tu_hoan_thanh} từ đạt yêu cầu.</Text>
          <View style={s.stats}>
            <Text style={s.topic}>
              {session.so_luot_dung}/{session.so_luot_tra_loi} lượt đúng
            </Text>
            <Text style={s.body}>Tỷ lệ đúng {session.ty_le_dung ?? 0}%</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            style={s.button}
            onPress={onClose}
          >
            <Text style={s.white}>Hoàn tất</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={s.row}>
            <Text style={s.body}>Lượt {session.so_luot_tra_loi + 1}</Text>
            <Text style={s.small}>Anh → Việt</Text>
          </View>
          <View style={s.card}>
            <View style={s.icon}>
              <Ionicons name="leaf-outline" size={28} color={c.green} />
            </View>
            <Text style={s.overline}>TỪ NÀY CÓ NGHĨA LÀ GÌ?</Text>
            <Text style={s.word}>{question.tu_tieng_anh}</Text>
            <Text style={s.phonetic}>
              {question.phien_am || "Chọn nghĩa phù hợp bên dưới"}
            </Text>
          </View>
          <Text style={s.prompt}>Chọn một đáp án</Text>
          <View style={s.answers}>
            {question.lua_chon.map((choice, index) => {
              const right = feedback?.dap_an_dung_id === choice.id;
              const wrong = !!feedback && selected === choice.id && !right;
              return (
                <Pressable
                  key={choice.id}
                  accessibilityRole="button"
                  accessibilityLabel={choice.noi_dung}
                  disabled={busy || selected !== null}
                  onPress={() => answer(choice.id)}
                  style={[s.option, right && s.right, wrong && s.wrong]}
                >
                  <View style={s.letter}>
                    <Text style={s.link}>
                      {String.fromCharCode(65 + index)}
                    </Text>
                  </View>
                  <Text style={s.optionText}>{choice.noi_dung}</Text>
                  {(right || wrong) && (
                    <Ionicons
                      name={right ? "checkmark-circle" : "close-circle"}
                      size={22}
                      color={right ? c.green : c.danger}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
          {busy && <ActivityIndicator color={c.green} />}
          {!!error && (
            <View style={[s.feedback, s.feedbackWrong]}>
              <Text accessibilityRole="alert" style={s.error}>
                {error}
              </Text>
              {pending && (
                <Pressable
                  accessibilityRole="button"
                  style={s.retryAnswer}
                  onPress={() => answer(pending.choiceId)}
                >
                  <Text style={s.link}>Thử gửi lại</Text>
                </Pressable>
              )}
            </View>
          )}
          {feedback && nextSession && (
            <View
              accessibilityRole="alert"
              style={[s.feedback, !feedback.dung && s.feedbackWrong]}
            >
              <Text style={[s.feedbackTitle, !feedback.dung && s.error]}>
                {feedback.dung
                  ? "Chính xác, tốt lắm!"
                  : "Chưa đúng, mình thử lại nhé."}
              </Text>
              <Text style={s.body}>
                {question.tu_tieng_anh} = {feedback.nghia_tieng_viet}
              </Text>
              <Text style={s.small}>
                {feedback.tu_da_hoan_thanh
                  ? "Từ này đã đạt yêu cầu trong phiên."
                  : "Từ này sẽ xuất hiện lại để củng cố trí nhớ."}
              </Text>
              <Pressable
                accessibilityRole="button"
                style={s.favorite}
                disabled={busy}
                onPress={saveWord}
              >
                <Ionicons
                  name={
                    saved.has(question.tu_vung_id) ? "heart" : "heart-outline"
                  }
                  size={20}
                  color={c.green}
                />
                <Text style={s.link}>
                  {saved.has(question.tu_vung_id)
                    ? "Đã lưu vào yêu thích"
                    : "Lưu từ này"}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={s.button}
                onPress={next}
              >
                <Text style={s.white}>
                  {nextSession.trang_thai === "hoan-thanh"
                    ? "Xem kết quả"
                    : "Câu tiếp theo"}
                </Text>
                <Ionicons name="arrow-forward" size={19} color="white" />
              </Pressable>
            </View>
          )}
        </>
      )}
      <Text style={s.footer}>
        Phiên luyện tập · Mỗi câu trả lời được tự động lưu
      </Text>
    </ScrollView>
  );
}

function Quiz({
  words,
  title,
  onClose,
}: {
  words: Word[];
  title: string;
  onClose: () => void;
}) {
  const [state, setState] = useState(() => createQuiz(words));
  const [options, setOptions] = useState(() => choicesFor(words[0], words));
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const item = state.items[state.current];
  const completed = state.items.filter((i) => i.done).length;
  const correct = !!item && selected === item.word.nghia_tieng_viet.trim();
  const progressStyle = StyleSheet.create({
    fill: { width: `${(completed / words.length) * 100}%` },
  });
  function answer(value: string) {
    if (selected !== null) return;
    setSelected(value);
    setState(answerQuiz(state, value === item.word.nghia_tieng_viet.trim()));
  }
  function next() {
    const updated = nextQuestion(state);
    setState(updated);
    setSelected(null);
    if (updated.current >= 0)
      setOptions(choicesFor(updated.items[updated.current].word, words));
  }
  function restart() {
    setState(createQuiz(words));
    setSelected(null);
    setOptions(choicesFor(words[0], words));
  }
  return (
    <ScrollView
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Thoát bài học"
          style={s.close}
          onPress={() =>
            state.turn && item ? setConfirmExit(true) : onClose()
          }
        >
          <Ionicons name="close" size={24} color={c.ink} />
        </Pressable>
        <View style={s.headerText}>
          <Text style={s.overline}>ÔN TẬP TRẮC NGHIỆM</Text>
          <Text style={s.topic}>{title}</Text>
        </View>
        <View style={s.counter}>
          <Ionicons name="layers-outline" size={17} color={c.green} />
          <Text style={s.link}>
            {completed}/{words.length}
          </Text>
        </View>
      </View>
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: words.length, now: completed }}
        style={s.track}
      >
        <View style={[s.fill, progressStyle.fill]} />
      </View>
      {confirmExit ? (
        <View style={s.card}>
          <Text style={s.title}>Dừng bài học này?</Text>
          <Text style={s.body}>
            Kết quả hiện chỉ giữ trong phiên. Thoát sẽ mất tiến độ bài này.
          </Text>
          <Pressable
            accessibilityRole="button"
            style={s.button}
            onPress={() => setConfirmExit(false)}
          >
            <Text style={s.white}>Tiếp tục học</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={s.close}
            onPress={onClose}
          >
            <Text style={s.link}>Thoát bài học</Text>
          </Pressable>
        </View>
      ) : !item ? (
        <View style={s.card}>
          <Ionicons name="checkmark-circle" size={64} color={c.green} />
          <Text style={s.title}>Bạn đã hoàn thành!</Text>
          <Text style={s.body}>
            {completed} từ đạt yêu cầu trong phiên này.
          </Text>
          <View style={s.stats}>
            <Text style={s.topic}>
              {state.correct}/{state.turn} lượt đúng
            </Text>
            <Text style={s.body}>
              {state.items.reduce((sum, i) => sum + i.mistakes, 0)} lượt cần
              luyện lại
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            style={s.button}
            onPress={restart}
          >
            <Text style={s.white}>Luyện lại từ đầu</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={s.close}
            onPress={onClose}
          >
            <Text style={s.link}>Về trang chủ</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={s.row}>
            <Text style={s.body}>
              Lượt {state.turn + (selected === null ? 1 : 0)}
            </Text>
            <Text style={s.small}>
              {item.mistakes ? "Luyện lại để nhớ lâu hơn" : "Anh → Việt"}
            </Text>
          </View>
          <View style={s.card}>
            <View style={s.icon}>
              <Ionicons name="leaf-outline" size={28} color={c.green} />
            </View>
            <Text style={s.overline}>TỪ NÀY CÓ NGHĨA LÀ GÌ?</Text>
            <Text style={s.word}>{item.word.tu_tieng_anh}</Text>
            <Text style={s.phonetic}>
              {item.word.phien_am || "Chọn nghĩa phù hợp bên dưới"}
            </Text>
          </View>
          <Text style={s.prompt}>Chọn một đáp án</Text>
          <View style={s.answers}>
            {options.map((value, index) => {
              const right =
                selected !== null &&
                value === item.word.nghia_tieng_viet.trim();
              const wrong = selected === value && !right;
              return (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityLabel={value}
                  accessibilityState={{
                    disabled: selected !== null,
                    selected: selected === value,
                  }}
                  disabled={selected !== null}
                  onPress={() => answer(value)}
                  style={[s.option, right && s.right, wrong && s.wrong]}
                >
                  <View style={s.letter}>
                    <Text style={s.link}>
                      {String.fromCharCode(65 + index)}
                    </Text>
                  </View>
                  <Text style={s.optionText}>{value}</Text>
                  {(right || wrong) && (
                    <Ionicons
                      name={right ? "checkmark-circle" : "close-circle"}
                      size={22}
                      color={right ? c.green : c.danger}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
          {selected !== null ? (
            <View
              accessibilityRole="alert"
              style={[s.feedback, !correct && s.feedbackWrong]}
            >
              <Text style={[s.feedbackTitle, !correct && s.error]}>
                {correct
                  ? "Chính xác, tốt lắm!"
                  : "Chưa đúng, mình thử lại nhé."}
              </Text>
              <Text style={s.body}>
                {item.word.tu_tieng_anh} = {item.word.nghia_tieng_viet}
              </Text>
              <Text style={s.small}>
                {item.done
                  ? "Từ này đã đạt yêu cầu trong phiên."
                  : correct
                    ? "Từ này sẽ quay lại để củng cố trí nhớ."
                    : "Từ này sẽ xuất hiện lại sau vài câu; nếu chỉ còn một từ, bạn sẽ gặp lại ngay."}
              </Text>
              <Pressable
                accessibilityRole="button"
                style={s.button}
                onPress={next}
              >
                <Text style={s.white}>
                  {completed === words.length ? "Xem kết quả" : "Câu tiếp theo"}
                </Text>
                <Ionicons name="arrow-forward" size={19} color="white" />
              </Pressable>
            </View>
          ) : (
            <View style={s.tip}>
              <Ionicons name="bulb-outline" size={19} color={c.green} />
              <Text style={s.small}>
                Không cần tự đánh dấu. Đáp án của bạn sẽ quyết định từ nào cần
                luyện thêm.
              </Text>
            </View>
          )}
        </>
      )}
      <Text style={s.footer}>Phiên học thử · Đăng nhập để lưu kết quả</Text>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: c.background },
  content: {
    padding: 22,
    gap: 18,
    width: "100%",
    maxWidth: 580,
    alignSelf: "center",
    paddingBottom: 32,
  },
  loading: {
    padding: 28,
    gap: 24,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerText: { flex: 1, gap: 5 },
  close: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  overline: {
    color: c.muted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.3,
  },
  topic: { color: c.ink, fontSize: 17, fontWeight: "700" },
  counter: {
    flexDirection: "row",
    gap: 6,
    padding: 10,
    borderRadius: 12,
    backgroundColor: c.soft,
  },
  link: { color: c.green, fontWeight: "700" },
  track: {
    height: 6,
    backgroundColor: c.line,
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: { height: "100%", backgroundColor: c.green },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  body: { fontSize: 14, lineHeight: 22, color: c.muted },
  small: { fontSize: 12, lineHeight: 19, color: c.muted, flexShrink: 1 },
  card: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    borderRadius: 26,
    padding: 26,
    alignItems: "center",
    gap: 17,
  },
  icon: { backgroundColor: c.soft, padding: 13, borderRadius: 18 },
  word: {
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: -1,
    color: c.ink,
    textAlign: "center",
  },
  phonetic: { fontSize: 16, color: c.muted },
  title: { fontSize: 25, color: c.ink, fontWeight: "700", textAlign: "center" },
  prompt: { color: c.ink, fontWeight: "600", fontSize: 15 },
  answers: { gap: 10 },
  option: {
    minHeight: 62,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    borderRadius: 16,
  },
  letter: {
    height: 34,
    width: 34,
    backgroundColor: c.soft,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: { color: c.ink, fontSize: 16, flex: 1, lineHeight: 23 },
  right: { borderColor: c.green, backgroundColor: "#EDF6EB" },
  wrong: { borderColor: c.danger, backgroundColor: "#FCECE8" },
  feedback: { padding: 18, borderRadius: 18, backgroundColor: c.soft, gap: 10 },
  feedbackWrong: { backgroundColor: "#FAEDE5" },
  feedbackTitle: { fontSize: 17, color: c.green, fontWeight: "700" },
  error: { color: c.danger },
  button: {
    minHeight: 50,
    padding: 16,
    backgroundColor: c.green,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  white: { color: "white", fontSize: 15, fontWeight: "700" },
  tip: { flexDirection: "row", padding: 12, gap: 9 },
  footer: { textAlign: "center", fontSize: 11, color: c.muted },
  stats: { gap: 8, alignItems: "center" },
  favorite: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  retryAnswer: {
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
});
