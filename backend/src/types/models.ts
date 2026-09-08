// User types
export interface NguoiDung {
  id: string;
  ho_ten: string;
  email: string;
  mat_khau_hash?: string;
  phuong_thuc_dang_nhap: 'local' | 'google';
  provider_id?: string;
  anh_dai_dien?: string;
  vai_tro: 'user' | 'admin';
  trang_thai: 'active' | 'inactive' | 'locked';
  ngay_tao: Date;
  ngay_cap_nhat: Date;
}

// Topic types
export interface ChuDe {
  id: string;
  ten: string;
  mo_ta?: string;
  hinh_anh?: string;
  trang_thai: 'active' | 'inactive';
  thu_tu_hien_thi: number;
  ngay_tao: Date;
  ngay_cap_nhat: Date;
}

// Word types
export type LoaiTu = 'danh-tu' | 'dong-tu' | 'tinh-tu' | 'trang-tu' | 'gioi-tu' | 'lien-tu' | 'dai-tu' | 'tham-tu';

export interface TuVung {
  id: string;
  chu_de_id: string;
  tu_tieng_anh: string;
  phien_am?: string;
  loai_tu: LoaiTu;
  nghia_tieng_viet: string;
  url_am_thanh?: string;
  url_hinh_anh?: string;
  thu_tu_hien_thi: number;
  ngay_tao: Date;
  ngay_cap_nhat: Date;
}

// Example types
export interface ViDu {
  id: string;
  tu_vung_id: string;
  cau_tieng_anh: string;
  cau_tieng_viet: string;
  thu_tu_hien_thi: number;
  ngay_tao: Date;
}

// Learning Session types
export type TrangThaiPhienHoc = 'dang-hoc' | 'hoan-thanh' | 'bo-do';

export interface PhienHocTap {
  id: string;
  nguoi_dung_id: string;
  chu_de_id: string;
  tong_so_tu: number;
  bat_dau_luc: Date;
  ket_thuc_luc?: Date;
  trang_thai: TrangThaiPhienHoc;
}

// Learning Result types
export type TrangThaiNhoTu = 'da-nho' | 'chua-chac' | 'chua-nho';

export interface KetQuaHoc {
  id: string;
  phien_hoc_tap_id: string;
  tu_vung_id: string;
  trang_thai: TrangThaiNhoTu;
  ngay_tao: Date;
}

// Progress types
export type TrangThaiTienDo = 'chua-hoc' | 'chua-nho' | 'chua-chac' | 'da-nho' | 'thuoc-long';

export interface TienDoTuVung {
  nguoi_dung_id: string;
  tu_vung_id: string;
  da_hoc: boolean;
  yeu_thich: boolean;
  so_lan_on_tap: number;
  trang_thai_nho: TrangThaiTienDo;
  ngay_on_tap_tiep_theo?: Date;
  lan_on_tap_cuoi?: Date;
  ngay_tao: Date;
  ngay_cap_nhat: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
