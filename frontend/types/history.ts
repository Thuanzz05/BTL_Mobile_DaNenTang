export interface StudySession {
  id: string;
  topic_name: string | null;
  tong_so_tu: number;
  bat_dau_luc: string;
  trang_thai: "dang-hoc" | "hoan-thanh" | "bo-do";
  phuong_thuc?: "flashcard" | "trac_nghiem" | "danh_gia";
  chu_de_id?: string;
  total_results: number;
}

export interface HistoryResponse {
  items: StudySession[];
  pagination: { page: number; total: number; totalPages: number };
}

export interface SessionDetail extends StudySession {
  results: {
    id: string;
    tu_tieng_anh: string;
    phien_am: string | null;
    nghia_tieng_viet: string;
    trang_thai: string;
  }[];
  luot_tra_loi: {
    id: string;
    thu_tu: number;
    tu_tieng_anh: string;
    dung: boolean | number;
    dap_an_chon_id: string;
    dap_an_dung_id: string;
    lua_chon: { id: string; noi_dung: string }[];
  }[];
}
