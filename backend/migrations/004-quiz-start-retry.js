/** Giữ mã khởi tạo để retry sau mất mạng không tạo thêm phiên học. */
module.exports = async function migrate(connection) {
  for (const [name, definition] of [
    ['ma_yeu_cau_khoi_tao', 'CHAR(36) NULL'],
    ['so_tu_yeu_cau', 'INT NULL'],
  ]) {
    const [columns] = await connection.query(
      'SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      ['phien_hoc_tap', name]
    );
    if (!columns.length) {
      await connection.query(`ALTER TABLE phien_hoc_tap ADD COLUMN ${name} ${definition}`);
    }
  }

  const [indexes] = await connection.query(
    'SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?',
    ['phien_hoc_tap', 'uq_quiz_start_request']
  );
  if (!indexes.length) {
    await connection.query(
      'CREATE UNIQUE INDEX uq_quiz_start_request ON phien_hoc_tap (nguoi_dung_id, ma_yeu_cau_khoi_tao)'
    );
  }
};
