import {
  Ref,
  useImperativeHandle,
  useState,
  useSyncExternalStore,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { palette as c } from "@/constants/palette";
import { useAuth } from "@/contexts/auth-context";
import { QuizSessionClient } from "@/services/quiz-session";
import type { AnswerResponse, QuizExitHandle, QuizSession } from "@/types/quiz";
import { quizStyles as s } from "./quiz.styles";

export function ServerQuiz({
  ref,
  quizClient,
  initial,
  title,
  onClose,
  onCompleted,
}: {
  ref: Ref<QuizExitHandle>;
  quizClient: QuizSessionClient;
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
  const draft = useSyncExternalStore(
    quizClient.subscribe,
    quizClient.getSnapshot,
  );
  const pending = draft?.pending;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmExit, setConfirmExit] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(() => new Set());
  const question = session.cau_hoi;
  const progress = session.tong_so_tu
    ? (session.so_tu_hoan_thanh / session.tong_so_tu) * 100
    : 0;

  function requestClose() {
    if (!busy && (nextSession || session).trang_thai !== "dang-hoc") onClose();
    else setConfirmExit(true);
  }
  useImperativeHandle(ref, () => ({ requestClose }));

  async function answer(choiceId: string) {
    if (!question || busy || feedback) return;
    setSelected(choiceId);
    setBusy(true);
    setError("");
    try {
      const response = await quizClient.answer(question.id, choiceId);
      setFeedback(response.ket_qua);
      if (response.ket_qua) setNextSession(response.phien);
      else {
        setSession(response.phien);
        setSelected(null);
      }
      if (response.phien.trang_thai === "hoan-thanh") onCompleted();
    } catch (answerError) {
      setError((answerError as Error).message);
      if (!quizClient.getSnapshot()?.pending) setSelected(null);
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
    if (busy) return;
    if ((nextSession || session).trang_thai !== "dang-hoc") return onClose();
    setBusy(true);
    setError("");
    try {
      await quizClient.stop();
      onCompleted();
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
          onPress={requestClose}
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
          <Text style={s.title}>Rời bài học?</Text>
          <Text style={s.body}>
            {draft?.stopping
              ? "Yêu cầu dừng đang chờ kết nối. Câu trả lời đang chờ sẽ được gửi trước khi dừng phiên."
              : "Lưu để học sau sẽ giữ bài và câu trả lời đang chờ. Dừng phiên sẽ kết thúc bài, giữ các lượt đã trả lời trong lịch sử."}
          </Text>
          {!!error && <Text style={s.error}>{error}</Text>}
          <Pressable
            accessibilityRole="button"
            style={s.button}
            disabled={busy || draft?.stopping}
            onPress={() => setConfirmExit(false)}
          >
            <Text style={s.white}>Tiếp tục học</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={s.close}
            disabled={busy}
            onPress={onClose}
          >
            <Text style={s.link}>
              {draft?.stopping
                ? "Về trang chủ, giữ yêu cầu dừng"
                : "Lưu để học sau"}
            </Text>
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
              <Text style={s.link}>
                {draft?.stopping ? "Thử dừng lại" : "Dừng phiên"}
              </Text>
            )}
          </Pressable>
        </View>
      ) : session.trang_thai !== "dang-hoc" || !question ? (
        <View style={s.card}>
          <Ionicons name="checkmark-circle" size={64} color={c.green} />
          <Text style={s.title}>
            {session.trang_thai === "bo-do"
              ? "Phiên học đã dừng"
              : "Bạn đã hoàn thành!"}
          </Text>
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
                  disabled={busy}
                  onPress={() => answer(pending.lua_chon_id)}
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
        {pending
          ? "Câu trả lời đã lưu trên máy, đang chờ gửi"
          : "Phiên luyện tập · Tự động lưu tiến trình"}
      </Text>
    </ScrollView>
  );
}
