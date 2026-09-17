import { Ref, useImperativeHandle, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { palette as c } from "@/constants/palette";
import type { Word } from "@/services/catalog";
import type { QuizExitHandle } from "@/types/quiz";
import {
  answerQuiz,
  choicesFor,
  createQuiz,
  nextQuestion,
} from "@/services/quiz";
import { quizStyles as s } from "./quiz.styles";

export function GuestQuiz({
  ref,
  words,
  title,
  onClose,
}: {
  ref: Ref<QuizExitHandle>;
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
  function requestClose() {
    if (item) setConfirmExit(true);
    else onClose();
  }
  useImperativeHandle(ref, () => ({ requestClose }));
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
