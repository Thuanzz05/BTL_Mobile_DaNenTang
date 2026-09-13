async function migrate(connection) {
  const [duplicates] = await connection.query(`SELECT phien_hoc_tap_id, tu_vung_id FROM ket_qua_hoc
    GROUP BY phien_hoc_tap_id, tu_vung_id HAVING COUNT(*) > 1 LIMIT 1`);
  if (duplicates.length) {
    throw new Error(
      'Có kết quả học trùng phiên–từ. Cần đối chiếu dữ liệu trước khi nâng cấp; chưa tự xóa bản ghi nào.'
    );
  }
  const addColumn = async (table, column, definition) => {
    const [rows] = await connection.query(
      'SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      [table, column]
    );
    if (!rows.length) {
      await connection.query('ALTER TABLE ' + table + ' ADD COLUMN ' + column + ' ' + definition);
    }
  };
  await addColumn('nguoi_dung', 'token_version', 'INT NOT NULL DEFAULT 0');
  await addColumn(
    'phien_hoc_tap',
    'loai_phien',
    "ENUM('hoc_moi', 'on_tap') NOT NULL DEFAULT 'hoc_moi'"
  );
  await connection.query('ALTER TABLE phien_hoc_tap MODIFY chu_de_id CHAR(36) NULL');
  await connection.query(`CREATE TABLE IF NOT EXISTS phien_hoc_tu (
    phien_hoc_tap_id CHAR(36) NOT NULL,
    tu_vung_id CHAR(36) NOT NULL,
    thu_tu INT NOT NULL,
    PRIMARY KEY (phien_hoc_tap_id, tu_vung_id),
    UNIQUE KEY unique_thu_tu (phien_hoc_tap_id, thu_tu),
    FOREIGN KEY (phien_hoc_tap_id) REFERENCES phien_hoc_tap(id) ON DELETE CASCADE,
    FOREIGN KEY (tu_vung_id) REFERENCES tu_vung(id) ON DELETE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  const [indexes] = await connection.query(
    "SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ket_qua_hoc' AND INDEX_NAME = 'unique_ket_qua_phien_tu'"
  );
  if (!indexes.length) {
    await connection.query(
      'ALTER TABLE ket_qua_hoc ADD UNIQUE KEY unique_ket_qua_phien_tu (phien_hoc_tap_id, tu_vung_id)'
    );
  }
  // Only recover membership when no list exists. Never guess the unsubmitted words of an old session.
  await connection.query(`INSERT INTO phien_hoc_tu (phien_hoc_tap_id, tu_vung_id, thu_tu)
    SELECT k.phien_hoc_tap_id, k.tu_vung_id,
      ROW_NUMBER() OVER (PARTITION BY k.phien_hoc_tap_id ORDER BY k.ngay_tao, k.id) - 1
    FROM ket_qua_hoc k WHERE NOT EXISTS (
      SELECT 1 FROM phien_hoc_tu p WHERE p.phien_hoc_tap_id = k.phien_hoc_tap_id
    )`);
}
module.exports = migrate;
