export interface AdminUser {
  id: string;
  ho_ten: string;
  email: string;
  vai_tro: 'admin' | 'user';
  anh_dai_dien?: string | null;
}
export interface Session {
  user: AdminUser;
  accessToken: string;
}
export interface Topic {
  id: string;
  ten: string;
  mo_ta: string | null;
  hinh_anh: string | null;
  trang_thai: 'active' | 'inactive';
  thu_tu_hien_thi: number;
  word_count: number;
}
export interface Example {
  cau_tieng_anh: string;
  cau_tieng_viet: string;
  thu_tu_hien_thi?: number;
}
export interface Word {
  id: string;
  chu_de_id: string;
  chu_de_ten?: string;
  tu_tieng_anh: string;
  nghia_tieng_viet: string;
  phien_am: string | null;
  loai_tu: string;
  url_hinh_anh: string | null;
  url_am_thanh: string | null;
  thu_tu_hien_thi: number;
  vi_du?: Example[];
}
export interface Learner {
  id: string;
  ho_ten: string;
  email: string;
  trang_thai: 'active' | 'inactive' | 'locked';
  phuong_thuc_dang_nhap: string;
  ngay_tao: string;
  so_phien_hoc: number;
}
export interface Page<T> {
  items: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
export interface Dashboard {
  tong_nguoi_dung: number;
  tong_chu_de: number;
  tong_tu_vung: number;
  tong_luot_hoc: number;
  phien_dang_hoc: number;
  nguoi_dung_moi_7_ngay: { ngay: string; so_luong: number }[];
  luot_hoc_7_ngay: { ngay: string; so_luong: number }[];
}
export interface Statistics {
  chu_de_pho_bien: { id: string; ten: string; luot_hoc: number }[];
  tu_pho_bien: { id: string; tu_tieng_anh: string; nghia_tieng_viet: string; luot_hoc: number }[];
  hoat_dong_7_ngay: { ngay: string; so_phien: number; so_tu: number }[];
}
export interface QuizReport {
  tu_ngay: string;
  den_ngay: string;
  tong_quan: {
    so_luot: number;
    so_luot_dung: number;
    so_luot_sai: number;
    ty_le_dung: number | null;
    so_nguoi: number;
    so_phien: number;
  };
  tu_can_luyen: {
    id: string;
    tu_tieng_anh: string;
    nghia_tieng_viet: string;
    chu_de_ten: string;
    so_luot: number;
    so_luot_sai: number;
    ty_le_sai: number;
    so_nguoi: number;
  }[];
}
