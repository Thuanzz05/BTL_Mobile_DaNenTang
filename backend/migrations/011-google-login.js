/** Ngăn một tài khoản Google bị liên kết với nhiều người dùng. */
module.exports = async function migrate(connection) {
  const [indexes] = await connection.query(
    "SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'nguoi_dung' AND INDEX_NAME = 'unique_login_provider'"
  );
  if (indexes.length) {
    return;
  }

  const [duplicates] = await connection.query(
    `SELECT 1 FROM nguoi_dung
     WHERE provider_id IS NOT NULL
     GROUP BY phuong_thuc_dang_nhap, provider_id HAVING COUNT(*) > 1 LIMIT 1`
  );
  if (duplicates.length) {
    throw new Error('Có provider_id Google bị trùng. Kiểm tra dữ liệu rồi chạy migration lại.');
  }
  await connection.query(
    'ALTER TABLE nguoi_dung ADD UNIQUE KEY unique_login_provider (phuong_thuc_dang_nhap, provider_id)'
  );
};
