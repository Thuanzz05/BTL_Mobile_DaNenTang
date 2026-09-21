module.exports = async function migrate(connection) {
  const [columns] = await connection.query(
    'SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    ['thanh_tich', 'trang_thai']
  );
  if (!columns.length) {
    await connection.query(
      "ALTER TABLE thanh_tich ADD COLUMN trang_thai ENUM('active', 'inactive') NOT NULL DEFAULT 'active'"
    );
  }
};
