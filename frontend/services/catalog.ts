import { api } from "./api";
export interface Topic {
  id: string;
  ten: string;
  mo_ta: string | null;
  word_count: number;
}
export interface Word {
  id: string;
  chu_de_id: string;
  tu_tieng_anh: string;
  phien_am: string | null;
  nghia_tieng_viet: string;
  loai_tu: string;
  url_am_thanh?: string | null;
  url_hinh_anh?: string | null;
}
export const getTopics = () => api<Topic[]>("/topics?status=active");
export const getTopic = (id: string) =>
  api<Topic>(`/topics/${encodeURIComponent(id)}`);
export const getWords = (id: string) =>
  api<Word[]>(`/words?topicId=${encodeURIComponent(id)}`);
