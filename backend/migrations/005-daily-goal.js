module.exports = async function migrate(connection) {
  const [columns] = await connection.query(
    'SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    ['nguoi_dung', 'muc_tieu_hang_ngay']
  );
  if (!columns.length) {
    await connection.query(
      'ALTER TABLE nguoi_dung ADD COLUMN muc_tieu_hang_ngay TINYINT UNSIGNED NOT NULL DEFAULT 20'
    );
  }
};
