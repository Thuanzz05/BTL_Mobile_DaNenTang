export interface QuizQuestion {
  id: string;
  tu_vung_id: string;
  tu_tieng_anh: string;
  phien_am: string | null;
  lua_chon: { id: string; noi_dung: string }[];
}

export interface QuizSession {
  phien_hoc_tap_id: string;
  trang_thai: "dang-hoc" | "hoan-thanh" | "bo-do";
  tong_so_tu: number;
  so_tu_hoan_thanh: number;
  so_luot_tra_loi: number;
  so_luot_dung: number;
  ty_le_dung: number | null;
  cau_hoi: QuizQuestion | null;
}

export interface AnswerResponse {
  ket_qua: {
    dung: boolean;
    dap_an_dung_id: string;
    nghia_tieng_viet: string;
    tu_da_hoan_thanh: boolean;
  } | null;
  phien: QuizSession;
}

export interface QuizStart {
  kind: "topic" | "review";
  topicId?: string;
  count: number;
  title: string;
}

export interface QuizDraft {
  version: 1;
  userId: string;
  start: QuizStart & { requestId: string };
  sessionId: string | null;
  pending: {
    cau_hoi_id: string;
    lua_chon_id: string;
    ma_yeu_cau: string;
  } | null;
  stopping: boolean;
}

export interface QuizExitHandle {
  requestClose(): void;
}
