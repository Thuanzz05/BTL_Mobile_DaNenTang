-- ỨNG DỤNG HỌC TỪ VỰNG TIẾNG ANH QUA FLASHCARD
-- DATABASE SCHEMA - 

CREATE DATABASE IF NOT EXISTS hoc_tu_vung
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE hoc_tu_vung;

-- ==========================================
-- 1. NGƯỜI DÙNG & XÁC THỰC
-- ==========================================

-- Bảng: Người dùng
CREATE TABLE nguoi_dung (
    id CHAR(36) PRIMARY KEY,
    ho_ten VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    mat_khau_hash VARCHAR(255) NULL,
    phuong_thuc_dang_nhap ENUM('local', 'google') NOT NULL DEFAULT 'local',
    provider_id VARCHAR(255) NULL COMMENT 'ID từ Google/Facebook',
    anh_dai_dien VARCHAR(255) NULL,
    vai_tro ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    trang_thai ENUM('active', 'inactive', 'locked') NOT NULL DEFAULT 'active',
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_trang_thai (trang_thai)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng: Token làm mới (JWT Refresh Tokens)
CREATE TABLE token_lam_moi (
    id CHAR(36) PRIMARY KEY,
    nguoi_dung_id CHAR(36) NOT NULL,
    token VARCHAR(512) NOT NULL UNIQUE,
    thoi_gian_het_han TIMESTAMP NOT NULL,
    da_thu_hoi BOOLEAN NOT NULL DEFAULT FALSE,
    thong_tin_thiet_bi VARCHAR(255) NULL,
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_nguoi_dung_id (nguoi_dung_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 2. CHỦ ĐỀ TỪ VỰNG
-- ==========================================

-- Bảng: Chủ đề
CREATE TABLE chu_de (
    id CHAR(36) PRIMARY KEY,
    ten VARCHAR(255) NOT NULL,
    mo_ta TEXT NULL,
    hinh_anh VARCHAR(500) NULL,
    trang_thai ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    thu_tu_hien_thi INT NOT NULL DEFAULT 0,
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_trang_thai (trang_thai),
    INDEX idx_thu_tu (thu_tu_hien_thi)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 3. TỪ VỰNG
-- ==========================================

-- Bảng: Từ vựng
CREATE TABLE tu_vung (
    id CHAR(36) PRIMARY KEY,
    chu_de_id CHAR(36) NOT NULL,
    tu_tieng_anh VARCHAR(120) NOT NULL,
    phien_am VARCHAR(120) NULL,
    loai_tu ENUM('danh-tu','dong-tu','tinh-tu','trang-tu','gioi-tu','lien-tu','dai-tu','tham-tu') NOT NULL,
    nghia_tieng_viet VARCHAR(255) NOT NULL,
    url_am_thanh VARCHAR(500) NULL COMMENT 'URL file phát âm MP3',
    url_hinh_anh VARCHAR(500) NULL COMMENT 'URL hình ảnh minh họa',
    thu_tu_hien_thi INT NOT NULL DEFAULT 0,
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (chu_de_id) REFERENCES chu_de(id) ON DELETE CASCADE,
    INDEX idx_chu_de_id (chu_de_id),
    INDEX idx_tu_tieng_anh (tu_tieng_anh),
    INDEX idx_thu_tu (thu_tu_hien_thi)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng: Ví dụ của từ vựng
CREATE TABLE vi_du (
    id CHAR(36) PRIMARY KEY,
    tu_vung_id CHAR(36) NOT NULL,
    cau_tieng_anh TEXT NOT NULL,
    cau_tieng_viet TEXT NOT NULL,
    thu_tu_hien_thi INT NOT NULL DEFAULT 0,
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tu_vung_id) REFERENCES tu_vung(id) ON DELETE CASCADE,
    INDEX idx_tu_vung_id (tu_vung_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 4. YÊU THÍCH
-- ==========================================

-- Bảng: Từ yêu thích
CREATE TABLE yeu_thich (
    id CHAR(36) PRIMARY KEY,
    nguoi_dung_id CHAR(36) NOT NULL,
    tu_vung_id CHAR(36) NOT NULL,
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(id) ON DELETE CASCADE,
    FOREIGN KEY (tu_vung_id) REFERENCES tu_vung(id) ON DELETE CASCADE,
    UNIQUE KEY unique_yeu_thich (nguoi_dung_id, tu_vung_id),
    INDEX idx_nguoi_dung_id (nguoi_dung_id),
    INDEX idx_tu_vung_id (tu_vung_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 5. PHIÊN HỌC TẬP (FLASHCARD SESSIONS)
-- ==========================================

-- Bảng: Phiên học tập
CREATE TABLE phien_hoc_tap (
    id CHAR(36) PRIMARY KEY,
    nguoi_dung_id CHAR(36) NOT NULL,
    chu_de_id CHAR(36) NOT NULL,
    tong_so_tu INT NOT NULL,
    bat_dau_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ket_thuc_luc TIMESTAMP NULL,
    trang_thai ENUM('dang-hoc', 'hoan-thanh', 'bo-do') NOT NULL DEFAULT 'dang-hoc',
    
    FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(id) ON DELETE CASCADE,
    FOREIGN KEY (chu_de_id) REFERENCES chu_de(id) ON DELETE CASCADE,
    INDEX idx_nguoi_dung_id (nguoi_dung_id),
    INDEX idx_chu_de_id (chu_de_id),
    INDEX idx_bat_dau_luc (bat_dau_luc),
    INDEX idx_trang_thai (trang_thai)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng: Kết quả học từng từ trong session (Flashcard Result)
CREATE TABLE ket_qua_hoc (
    id CHAR(36) PRIMARY KEY,
    phien_hoc_tap_id CHAR(36) NOT NULL,
    tu_vung_id CHAR(36) NOT NULL,
    trang_thai ENUM('da-nho', 'chua-chac', 'chua-nho') NOT NULL COMMENT 'Đánh giá của user: 😄 Đã nhớ / 😐 Chưa chắc / 😟 Chưa nhớ',
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (phien_hoc_tap_id) REFERENCES phien_hoc_tap(id) ON DELETE CASCADE,
    FOREIGN KEY (tu_vung_id) REFERENCES tu_vung(id) ON DELETE CASCADE,
    INDEX idx_phien_hoc_tap_id (phien_hoc_tap_id),
    INDEX idx_tu_vung_id (tu_vung_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 6. TIẾN ĐỘ HỌC TẬP & SPACED REPETITION
-- ==========================================

-- Bảng: Tiến độ học từ vựng (Spaced Repetition System)
CREATE TABLE tien_do_tu_vung (
    nguoi_dung_id CHAR(36) NOT NULL,
    tu_vung_id CHAR(36) NOT NULL,
    
    -- Trạng thái học
    da_hoc BOOLEAN NOT NULL DEFAULT FALSE,
    yeu_thich BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Spaced Repetition System (SRS) - Thuật toán ôn tập thông minh
    so_lan_on_tap INT NOT NULL DEFAULT 0,
    trang_thai_nho ENUM('chua-hoc', 'chua-nho', 'chua-chac', 'da-nho', 'thuoc-long') NOT NULL DEFAULT 'chua-hoc',
    ngay_on_tap_tiep_theo TIMESTAMP NULL COMMENT 'Ngày cần ôn tập lại từ này',
    lan_on_tap_cuoi TIMESTAMP NULL,
    
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (nguoi_dung_id, tu_vung_id),
    FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(id) ON DELETE CASCADE,
    FOREIGN KEY (tu_vung_id) REFERENCES tu_vung(id) ON DELETE CASCADE,
    
    INDEX idx_nguoi_dung_id (nguoi_dung_id),
    INDEX idx_yeu_thich (nguoi_dung_id, yeu_thich),
    INDEX idx_da_hoc (nguoi_dung_id, da_hoc),
    INDEX idx_on_tap_tiep (nguoi_dung_id, ngay_on_tap_tiep_theo) COMMENT 'CỰC KỲ QUAN TRỌNG - Query từ cần ôn tập'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 7. HOẠT ĐỘNG HỌC TẬP (Tùy chọn - cho Dashboard/Statistics)
-- ==========================================

-- Bảng: Hoạt động học tập (Activity Log)
CREATE TABLE hoat_dong_hoc_tap (
    id CHAR(36) PRIMARY KEY,
    nguoi_dung_id CHAR(36) NOT NULL,
    loai_hoat_dong VARCHAR(100) NOT NULL COMMENT 'hoan_thanh_session, on_tap, them_yeu_thich, ...',
    mo_ta TEXT NOT NULL,
    diem_kinh_nghiem INT NOT NULL DEFAULT 0,
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(id) ON DELETE CASCADE,
    INDEX idx_nguoi_dung_id (nguoi_dung_id),
    INDEX idx_ngay_tao (ngay_tao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 8. THÀNH TÍCH (Tùy chọn - Gamification)
-- ==========================================

-- Bảng: Thành tích
CREATE TABLE thanh_tich (
    id CHAR(36) PRIMARY KEY,
    tieu_de VARCHAR(150) NOT NULL,
    mo_ta TEXT NOT NULL,
    bieu_tuong VARCHAR(100) NOT NULL COMMENT 'Icon name: medal, flame, star, book...',
    diem_thuong INT NOT NULL DEFAULT 0,
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng: Thành tích của người dùng
CREATE TABLE thanh_tich_nguoi_dung (
    nguoi_dung_id CHAR(36) NOT NULL,
    thanh_tich_id CHAR(36) NOT NULL,
    ngay_mo_khoa TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (nguoi_dung_id, thanh_tich_id),
    FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(id) ON DELETE CASCADE,
    FOREIGN KEY (thanh_tich_id) REFERENCES thanh_tich(id) ON DELETE CASCADE,
    INDEX idx_nguoi_dung_id (nguoi_dung_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


