const { connect, migrate, databaseName } = require('./database-tools');
(async () => {
  const connection = await connect();
  try {
    await migrate(connection, databaseName());
    console.log('Đã tạo/nâng cấp database, giữ dữ liệu hiện có.');
  } finally {
    await connection.end();
  }
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
