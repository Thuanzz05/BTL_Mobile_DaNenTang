const { connect, databaseName, migrate } = require('./database-tools');
const { businessTables, readDatabaseSource } = require('./sql-source');

/**
 * Nạp mẫu chỉ khi toàn bộ bảng nghiệp vụ đang trống.
 * File seed không chứa TRUNCATE hoặc tắt kiểm tra khóa ngoại.
 */
async function seedDatabase(connection) {
  for (const table of businessTables) {
    const [rows] = await connection.query('SELECT COUNT(*) AS count FROM ' + table);

    if (rows[0].count > 0) {
      throw new Error('Database đã có dữ liệu. Không nạp lại dữ liệu mẫu.');
    }
  }

  const { seed } = readDatabaseSource();

  await connection.beginTransaction();

  try {
    for (const statement of seed) {
      await connection.query(statement);
    }
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
