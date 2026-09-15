/**
 * Từ cũ tiếp tục hiển thị; ẩn từ không xóa dữ liệu học hoặc ví dụ.
 * Kiểm tra từng bước để có thể chạy lại sau khi DDL bị gián đoạn.
 */
module.exports = async function migrate(connection) {
  const [columns] = await connection.query(
    'SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    ['tu_vung', 'trang_thai']
  );
  if (!columns.length) {
    await connection.query(
      "ALTER TABLE tu_vung ADD COLUMN trang_thai ENUM('active', 'inactive') NOT NULL DEFAULT 'active'"
    );
  }

  const [indexes] = await connection.query(
    'SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?',
    ['tu_vung', 'idx_tu_vung_chu_de_trang_thai']
  );
  if (!indexes.length) {
    await connection.query(
      'CREATE INDEX idx_tu_vung_chu_de_trang_thai ON tu_vung (chu_de_id, trang_thai, thu_tu_hien_thi)'
    );
  }
};
