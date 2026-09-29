import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { palette as c } from "@/constants/palette";
import { Topic } from "@/services/catalog";
import { useAuth } from "@/contexts/auth-context";
import { useQuizSession } from "@/hooks/use-quiz-session";
import type { QuizExitHandle, QuizSession } from "@/types/quiz";
import { ServerQuiz } from "./server-quiz";
import { quizStyles as s } from "./quiz.styles";

export function FlashcardPreview({
  topic,
  reviewCount = 0,
  resume = false,
  onClose,
  onCompleted,
}: {
  topic: Topic | null;
  reviewCount?: number;
  resume?: boolean;
  onClose: () => void;
  onCompleted: () => void;
}) {
  const { ready, user, error: authError } = useAuth();
  const { client } = useQuizSession();
  const exitRef = useRef<QuizExitHandle>(null);
  const [serverSession, setServerSession] = useState<QuizSession | null>(null);
  const [serverOwner, setServerOwner] = useState<string>();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [confirmExit, setConfirmExit] = useState(false);
  const [title, setTitle] = useState("");
  const topicId = topic?.id;
  const topicTitle = topic?.ten || "Từ vựng";
  const wordCount = Number(topic?.word_count || 0);
  const visible = !!topic || reviewCount > 0 || resume;
  const userId = user?.id;
  const ownerId = useRef(userId);
  useEffect(() => {
    if (!visible || !ready) return;
    let active = true;
    async function open() {
      try {
        if (authError) throw new Error(authError);
        if (ownerId.current && userId !== ownerId.current) {
          throw new Error("Hãy đăng nhập lại để tiếp tục bài học đã lưu.");
        }
        if (client) {
          ownerId.current = userId;
          const result = await client.open(
            resume
              ? undefined
              : reviewCount
                ? {
                    kind: "review",
                    count: Math.min(20, reviewCount),
                    title: "Ôn tập hôm nay",
                  }
                : {
                    kind: "topic",
                    topicId,
                    count: Math.min(20, Math.max(5, wordCount)),
                    title: topicTitle,
                  },
          );
          if (active) {
            setTitle(result.title);
            setServerOwner(userId);
            setServerSession(result.session);
          }
        } else {
          throw new Error("Hãy đăng nhập để làm trắc nghiệm và lưu kết quả.");
        }
      } catch (failure) {
        if (active) setError((failure as Error).message);
      }
    }
    void open();
    return () => {
      active = false;
    };
  }, [
    attempt,
    client,
    ready,
    reviewCount,
    topicId,
    topicTitle,
    wordCount,
    userId,
    visible,
    resume,
    authError,
  ]);
  function requestClose() {
    if (exitRef.current) exitRef.current.requestClose();
    else setConfirmExit(true);
  }
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={requestClose}
    >
      <SafeAreaView style={s.page}>
        {confirmExit ? (
          <View style={s.loading}>
            <Text style={s.title}>Rời bài học?</Text>
            <Text style={s.body}>
              {client
                ? "Bài đang chờ sẽ được giữ để kết nối lại từ trang chủ."
                : "Bạn có thể chọn lại chủ đề ở trang chủ."}
            </Text>
            <Pressable
              accessibilityRole="button"
              style={s.button}
              onPress={() => setConfirmExit(false)}
            >
              <Text style={s.white}>Ở lại</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={s.close}
              onPress={onClose}
            >
              <Text style={s.link}>Về trang chủ</Text>
            </Pressable>
          </View>
        ) : serverSession && client && userId === serverOwner ? (
          <ServerQuiz
            ref={exitRef}
            quizClient={client}
            key={serverSession.phien_hoc_tap_id}
            initial={serverSession}
            title={title}
            onClose={onClose}
            onCompleted={onCompleted}
          />
        ) : (
          <View style={s.loading}>
            <Pressable
              accessibilityRole="button"
              onPress={requestClose}
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
            ) : (
              <ActivityIndicator size="large" color={c.green} />
            )}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}
