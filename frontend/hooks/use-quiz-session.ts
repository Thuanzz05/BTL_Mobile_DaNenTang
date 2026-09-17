import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useAuth } from "@/contexts/auth-context";
import { AuthClient } from "@/services/auth-client";
import { QuizSessionClient } from "@/services/quiz-session";
import { quizStorage } from "@/services/quiz-storage";

const clients = new WeakMap<AuthClient, Map<string, QuizSessionClient>>();
const emptySubscribe = () => () => {};
const emptySnapshot = () => null;

function clientFor(auth: AuthClient, userId: string) {
  let accounts = clients.get(auth);
  if (!accounts) {
    accounts = new Map();
    clients.set(auth, accounts);
  }
  let client = accounts.get(userId);
  if (!client) {
    client = new QuizSessionClient(
      userId,
      (path, options) => {
        if (auth.userId !== userId)
          return Promise.reject(
            new Error("Hãy đăng nhập lại tài khoản của bài học này."),
          );
        return auth.authorized(path, options);
      },
      quizStorage,
    );
    accounts.set(userId, client);
  }
  return client;
}

export function useQuizSession() {
  const { client: auth, user } = useAuth();
  const userId = user?.id;
  const client = useMemo(
    () => (userId ? clientFor(auth, userId) : null),
    [auth, userId],
  );
  const draft = useSyncExternalStore(
    client?.subscribe ?? emptySubscribe,
    client?.getSnapshot ?? emptySnapshot,
    emptySnapshot,
  );
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    client
      ?.load()
      .then(() => {
        if (active) setError("");
      })
      .catch((failure) => {
        if (active) setError((failure as Error).message);
      });
    return () => {
      active = false;
    };
  }, [client, attempt]);

  return {
    client,
    draft,
    error,
    retry: () => setAttempt((value) => value + 1),
  };
}
