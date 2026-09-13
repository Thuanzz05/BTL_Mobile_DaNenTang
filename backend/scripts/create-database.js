const mysql = require('mysql2/promise');
const { connect, databaseName } = require('./database-tools');
(async () => {
  const connection = await connect();
  try {
    await connection.query(
      'CREATE DATABASE IF NOT EXISTS ' +
        mysql.escapeId(databaseName()) +
        ' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
    );
    console.log('Database đã sẵn sàng. Chạy npm run db:migrate để tạo/nâng cấp bảng.');
  } finally {
    await connection.end();
  }
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
