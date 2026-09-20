module.exports = async function migrate(connection) {
  await connection.query(`CREATE TABLE IF NOT EXISTS ma_dat_lai_mat_khau (
    id CHAR(36) PRIMARY KEY,
    nguoi_dung_id CHAR(36) NOT NULL,
    ma_hash CHAR(64) NOT NULL,
    het_han_luc TIMESTAMP NOT NULL,
    so_lan_thu TINYINT UNSIGNED NOT NULL DEFAULT 0,
    da_su_dung_luc TIMESTAMP NULL,
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(id) ON DELETE CASCADE,
    INDEX idx_ma_dat_lai_nguoi_dung (nguoi_dung_id),
    INDEX idx_ma_dat_lai_het_han (het_han_luc)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
};
