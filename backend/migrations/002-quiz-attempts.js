/**
 * Bổ sung trắc nghiệm; các phiên cũ giữ phương thức đánh giá.
 * Có thể chạy lại sau khi một bước DDL bị gián đoạn.
 */
module.exports = async function migrate(connection) {
  async function addColumn(table, column, definition) {
    const [rows] = await connection.query(
      'SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      [table, column]
    );
    if (!rows.length) {
      await connection.query('ALTER TABLE ' + table + ' ADD COLUMN ' + column + ' ' + definition);
    }
  }

  await addColumn(
    'phien_hoc_tap',
    'phuong_thuc',
    "ENUM('danh_gia', 'trac_nghiem') NOT NULL DEFAULT 'danh_gia'"
  );
  await addColumn('phien_hoc_tap', 'phien_ban_thuat_toan', 'VARCHAR(30) NULL');
  await addColumn('phien_hoc_tu', 'noi_dung_trac_nghiem', 'JSON NULL');

  await connection.query(`CREATE TABLE IF NOT EXISTS cau_hoi_trac_nghiem (
    id CHAR(36) PRIMARY KEY,
    phien_hoc_tap_id CHAR(36) NOT NULL,
    tu_vung_id CHAR(36) NOT NULL,
    thu_tu INT NOT NULL,
    lua_chon JSON NOT NULL,
    dap_an_dung_id CHAR(36) NOT NULL,
    dap_an_chon_id CHAR(36) NULL,
    dung BOOLEAN NULL,
    ma_yeu_cau CHAR(36) NULL,
    thoi_gian_tra_loi_ms INT NULL,
    tao_luc TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    tra_loi_luc TIMESTAMP(3) NULL,
    phan_hoi JSON NULL,
    UNIQUE KEY unique_cau_hoi_thu_tu (phien_hoc_tap_id, thu_tu),
    UNIQUE KEY unique_luot_gui (phien_hoc_tap_id, ma_yeu_cau),
    INDEX idx_quiz_thong_ke (tra_loi_luc, tu_vung_id, dung),
    FOREIGN KEY (phien_hoc_tap_id, tu_vung_id)
      REFERENCES phien_hoc_tu(phien_hoc_tap_id, tu_vung_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
};
