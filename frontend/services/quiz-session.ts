import type {
  AnswerResponse,
  QuizDraft,
  QuizSession,
  QuizStart,
} from "../types/quiz";
import { requestId } from "./quiz";

export interface QuizStorage {
  read(key: string): Promise<string | null>;
  write(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

type Request = <T>(path: string, options?: RequestInit) => Promise<T>;
const post = (body?: unknown): RequestInit => ({
  method: "POST",
  body: body === undefined ? undefined : JSON.stringify(body),
});
const codeOf = (error: unknown) => (error as { code?: string })?.code;
const uuid = (value: unknown) =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

function parseDraft(raw: string, userId: string): QuizDraft {
  const value = JSON.parse(raw) as QuizDraft;
  const start = value?.start;
  const pending = value?.pending;
  if (
    value?.version !== 1 ||
    value.userId !== userId ||
    typeof value.stopping !== "boolean" ||
    (value.sessionId !== null && !uuid(value.sessionId)) ||
    !start ||
    !uuid(start.requestId) ||
    typeof start.title !== "string" ||
    !Number.isInteger(start.count) ||
    start.count < 1 ||
    start.count > 50 ||
    !(
      start.kind === "review" ||
      (start.kind === "topic" &&
        typeof start.topicId === "string" &&
        start.topicId.length > 0 &&
        start.count >= 5)
    ) ||
    (pending !== null &&
      (!value.sessionId ||
        !uuid(pending?.cau_hoi_id) ||
        !uuid(pending?.lua_chon_id) ||
        !uuid(pending?.ma_yeu_cau)))
  ) {
    throw new Error(
      "Bản lưu bài học không hợp lệ. Chưa gửi thêm dữ liệu lên máy chủ.",
    );
  }
  return value;
}

/** Một hàng đợi nhỏ cho từng tài khoản; luôn ghi xuống máy trước khi gửi mạng. */
export class QuizSessionClient {
  private draft: QuizDraft | null = null;
  private loaded = false;
  private loading: Promise<void> | null = null;
  private opening: Promise<{ session: QuizSession; title: string }> | null =
    null;
  private busy = false;
  private listeners = new Set<() => void>();
  private readonly key: string;

  constructor(
    private userId: string,
    private request: Request,
    private storage: QuizStorage,
  ) {
    this.key = `wordleaf.quiz.v1.${userId}`;
  }

  getSnapshot = () => this.draft;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  load(): Promise<void> {
    if (this.loaded) return Promise.resolve();
    if (!this.loading) {
      this.loading = (async () => {
        const raw = await this.storage.read(this.key);
        this.draft = raw === null ? null : parseDraft(raw, this.userId);
        this.loaded = true;
        this.listeners.forEach((listener) => listener());
      })().finally(() => {
        this.loading = null;
      });
    }
    return this.loading;
  }

  private async save(draft: QuizDraft | null) {
    try {
      if (draft) await this.storage.write(this.key, JSON.stringify(draft));
      else await this.storage.remove(this.key);
    } catch {
      throw new Error(
        "Chưa lưu được tiến trình trên máy. Hãy kiểm tra dung lượng và thử lại.",
      );
    }
    this.draft = draft;
    this.listeners.forEach((listener) => listener());
  }

  private async exclusive<T>(work: () => Promise<T>): Promise<T> {
    if (this.busy) throw new Error("Đang lưu bài học, vui lòng chờ một chút.");
    this.busy = true;
    try {
      await this.load();
      return await work();
    } catch (error) {
      if (codeOf(error) === "SESSION_NOT_FOUND") await this.save(null);
      throw error;
    } finally {
      this.busy = false;
    }
  }

  /** Dùng lại cả mã khởi tạo nếu app đóng trước khi nhận được ID phiên. */
  open(start?: QuizStart) {
    if (!this.opening) {
      this.opening = this.exclusive(async () => {
        if (!this.draft) {
          if (!start)
            throw new Error(
              "Không còn bài học đang chờ. Hãy chọn một chủ đề mới.",
            );
          await this.save({
            version: 1,
            userId: this.userId,
            start: {
              ...start,
              title: start.title.slice(0, 120),
              requestId: requestId(),
            },
            sessionId: null,
            pending: null,
            stopping: false,
          });
        }
        let draft = this.draft!;
        if (!draft.sessionId) {
          let session: QuizSession;
          try {
            session = await this.request<QuizSession>(
              draft.start.kind === "review"
                ? "/quiz/review/start"
                : "/quiz/start",
              post({
                ...(draft.start.kind === "topic"
                  ? { chu_de_id: draft.start.topicId }
                  : {}),
                tong_so_tu: draft.start.count,
                ma_yeu_cau: draft.start.requestId,
              }),
            );
          } catch (error) {
            // Các lỗi này bảo đảm chưa tạo phiên; người học có thể chọn bài khác.
            if (
              [
                "TOPIC_NOT_FOUND",
                "NO_REVIEW_WORDS",
                "INSUFFICIENT_WORDS",
                "INSUFFICIENT_CHOICES",
              ].includes(codeOf(error) || "")
            )
              await this.save(null);
            throw error;
          }
          draft = { ...draft, sessionId: session.phien_hoc_tap_id };
          await this.save(draft);
        }
        if (draft.pending) await this.sendPending();
        const session = draft.stopping
          ? await this.request<QuizSession>(
              `/quiz/${draft.sessionId}/stop`,
              post(),
            )
          : await this.request<QuizSession>(`/quiz/${draft.sessionId}`);
        if (session.trang_thai !== "dang-hoc") await this.save(null);
        return { session, title: draft.start.title };
      }).finally(() => {
        this.opening = null;
      });
    }
    return this.opening;
  }

  private async sendPending(): Promise<AnswerResponse> {
    const draft = this.draft!;
    let response: AnswerResponse;
    try {
      response = await this.request<AnswerResponse>(
        `/quiz/${draft.sessionId}/answers`,
        post(draft.pending),
      );
    } catch (error) {
      if (
        !["QUESTION_ALREADY_ANSWERED", "SESSION_CLOSED"].includes(
          codeOf(error) || "",
        )
      )
        throw error;
      // Có thể phiên đã được xử lý trên thiết bị khác; lấy trạng thái thực tế.
      response = {
        ket_qua: null,
        phien: await this.request<QuizSession>(`/quiz/${draft.sessionId}`),
      };
    }
    await this.save(
      response.phien.trang_thai === "dang-hoc"
        ? { ...draft, pending: null }
        : null,
    );
    return response;
  }

  answer(questionId: string, choiceId: string) {
    return this.exclusive(async () => {
      const draft = this.draft;
      if (!draft?.sessionId || draft.stopping)
        throw new Error("Hãy mở lại bài học để đồng bộ tiến trình.");
      if (
        draft.pending &&
        (draft.pending.cau_hoi_id !== questionId ||
          draft.pending.lua_chon_id !== choiceId)
      ) {
        throw new Error(
          "Cần gửi xong câu trả lời đang chờ trước khi chọn đáp án khác.",
        );
      }
      if (!draft.pending)
        await this.save({
          ...draft,
          pending: {
            cau_hoi_id: questionId,
            lua_chon_id: choiceId,
            ma_yeu_cau: requestId(),
          },
        });
      return this.sendPending();
    });
  }

  stop() {
    return this.exclusive(async () => {
      const draft = this.draft;
      if (!draft?.sessionId)
        throw new Error("Hãy kết nối lại bài học trước khi dừng phiên.");
      await this.save({ ...draft, stopping: true });
      if (draft.pending) await this.sendPending();
      const session = await this.request<QuizSession>(
        `/quiz/${draft.sessionId}/stop`,
        post(),
      );
      await this.save(null);
      return session;
    });
  }
}
