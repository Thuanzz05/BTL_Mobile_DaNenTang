/** Tách học flashcard khỏi trắc nghiệm, giữ nguyên lịch sử cũ. */
module.exports = async function migrate(connection) {
  await connection.query(
    "ALTER TABLE phien_hoc_tap MODIFY phuong_thuc ENUM('danh_gia', 'trac_nghiem', 'flashcard') NOT NULL DEFAULT 'danh_gia'"
  );
  await connection.query(
    "ALTER TABLE ket_qua_hoc MODIFY trang_thai ENUM('da-nho', 'chua-chac', 'chua-nho', 'da-xem') NOT NULL"
  );
  const [columns] = await connection.query(
    "SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'phien_hoc_tu' AND COLUMN_NAME = 'da_xem_luc'"
  );
  if (!columns.length) {
    await connection.query('ALTER TABLE phien_hoc_tu ADD da_xem_luc DATETIME NULL');
  }

  // Không tự xóa/gộp dữ liệu trùng; báo lỗi để chủ dữ liệu xử lý trước khi chạy lại.
  for (const [table, index, fields] of [
    ['chu_de', 'unique_topic_name', 'ten'],
    ['tu_vung', 'unique_topic_word', 'chu_de_id, tu_tieng_anh'],
    ['thanh_tich', 'unique_achievement_title', 'tieu_de'],
  ]) {
    const [indexes] = await connection.query(
      'SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?',
      [table, index]
    );
    if (!indexes.length) {
      const [duplicates] = await connection.query(
        `SELECT 1 FROM ${table} GROUP BY ${fields} HAVING COUNT(*) > 1 LIMIT 1`
      );
      if (duplicates.length) {
        throw new Error(
          `Có dữ liệu trùng trong ${table} (${fields}). Kiểm tra dữ liệu rồi chạy migration lại.`
        );
      }
      await connection.query(`ALTER TABLE ${table} ADD UNIQUE KEY ${index} (${fields})`);
    }
  }
};
