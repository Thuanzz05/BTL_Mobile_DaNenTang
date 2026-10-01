/** Bổ sung câu nhập từ nhưng giữ nguyên toàn bộ câu trắc nghiệm đã lưu. */
module.exports = async function migrate(connection) {
  async function addColumn(column, definition) {
    const [rows] = await connection.query(
      'SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      ['cau_hoi_trac_nghiem', column]
    );
    if (!rows.length) {
      await connection.query(
        'ALTER TABLE cau_hoi_trac_nghiem ADD COLUMN ' + column + ' ' + definition
      );
    }
  }

  await addColumn(
    'loai_cau_hoi',
    "ENUM('trac-nghiem', 'nhap-tu') NOT NULL DEFAULT 'trac-nghiem' AFTER thu_tu"
  );
  await addColumn('dap_an_dung_text', 'VARCHAR(120) NULL AFTER dap_an_dung_id');
  await addColumn('dap_an_chon_text', 'VARCHAR(120) NULL AFTER dap_an_chon_id');
  await connection.query('ALTER TABLE cau_hoi_trac_nghiem MODIFY dap_an_dung_id CHAR(36) NULL');
};
