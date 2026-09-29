/**
 * Lưu ngăn Leitner cho từng từ. Dữ liệu cũ được quy đổi một lần theo trạng thái
 * và số lượt ôn hiện có; migration có thể chạy lại an toàn.
 */
module.exports = async function migrate(connection) {
  const [columns] = await connection.query(
    'SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    ['tien_do_tu_vung', 'ngan_leitner']
  );

  if (!columns.length) {
    await connection.query(
      'ALTER TABLE tien_do_tu_vung ADD COLUMN ngan_leitner TINYINT UNSIGNED NOT NULL DEFAULT 1 AFTER so_lan_on_tap'
    );
    await connection.query(`UPDATE tien_do_tu_vung
      SET ngan_leitner = CASE
        WHEN da_hoc = FALSE OR trang_thai_nho IN ('chua-hoc', 'chua-nho') THEN 1
        WHEN trang_thai_nho = 'chua-chac' THEN 2
        WHEN trang_thai_nho = 'thuoc-long' THEN 5
        WHEN trang_thai_nho = 'da-nho' THEN LEAST(5, GREATEST(2, so_lan_on_tap + 1))
        ELSE 1
      END`);
    await connection.query(`UPDATE tien_do_tu_vung
      SET trang_thai_nho = CASE
        WHEN da_hoc = FALSE THEN 'chua-hoc'
        WHEN ngan_leitner = 1 THEN 'chua-nho'
        WHEN ngan_leitner = 5 THEN 'thuoc-long'
        ELSE 'da-nho'
      END`);
  }
};
