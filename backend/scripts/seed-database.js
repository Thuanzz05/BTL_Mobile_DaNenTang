const fs = require('fs');
const path = require('path');
const { connect, databaseName, migrate } = require('./database-tools');

/**
 * Nạp mẫu chỉ khi toàn bộ bảng nghiệp vụ đang trống.
 * File seed không chứa TRUNCATE hoặc tắt kiểm tra khóa ngoại.
 */
async function seedDatabase(connection) {
  const tables = [
    'nguoi_dung',
    'token_lam_moi',
    'chu_de',
    'tu_vung',
    'vi_du',
    'yeu_thich',
    'phien_hoc_tap',
    'phien_hoc_tu',
    'ket_qua_hoc',
    'tien_do_tu_vung',
    'hoat_dong_hoc_tap',
    'thanh_tich',
    'thanh_tich_nguoi_dung',
  ];

  for (const table of tables) {
    const [rows] = await connection.query('SELECT COUNT(*) AS count FROM ' + table);

    if (rows[0].count > 0) {
      throw new Error('Database đã có dữ liệu. Không nạp lại dữ liệu mẫu.');
    }
  }

  const seed = fs
    .readFileSync(path.join(__dirname, '../database_seed.sql'), 'utf8')
    .replace(/^USE\s+[^;]+;/gim, '');

  await connection.beginTransaction();

  try {
    await connection.query(seed);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

async function main() {
  const connection = await connect();

  try {
    await migrate(connection, databaseName());
    await seedDatabase(connection);

    console.log('Đã nạp dữ liệu mẫu.');
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { seedDatabase };
