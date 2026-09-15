const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { readDatabaseSource } = require('./sql-source');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

function databaseName() {
  const name = process.env.DB_NAME || 'hoc_tu_vung';
  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    throw new Error('DB_NAME chỉ được chứa chữ, số và dấu gạch dưới');
  }
  return name;
}
function config() {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
    timezone: 'Z',
    decimalNumbers: true,
  };
}
async function connect() {
  const connection = await mysql.createConnection(config());
  await connection.query("SET time_zone = '+00:00'");
  return connection;
}
async function migrate(connection, name) {
  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    throw new Error('Tên database không hợp lệ');
  }
  const source = readDatabaseSource();
  await connection.query(
    'CREATE DATABASE IF NOT EXISTS ' +
      mysql.escapeId(name) +
      ' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
  );
  await connection.changeUser({ database: name });
  await connection.query("SET time_zone = '+00:00'");
  const [lock] = await connection.query('SELECT GET_LOCK(?, 10) AS acquired', [
    'flashcard-migrate-' + name,
  ]);
  if (Number(lock[0].acquired) !== 1) {
    throw new Error('Một tiến trình khác đang nâng cấp database');
  }
  try {
    for (const statement of source.schema) {
      await connection.query(statement);
    }
    await connection.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(150) PRIMARY KEY, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`);
    for (const file of fs
      .readdirSync(path.join(__dirname, '../migrations'))
      .filter((file) => file.endsWith('.js'))
      .sort()) {
      const [done] = await connection.query('SELECT name FROM schema_migrations WHERE name = ?', [
        file,
      ]);
      if (done.length) {
        continue;
      }
      await require(path.join(__dirname, '../migrations', file))(connection);
      await connection.query('INSERT INTO schema_migrations (name) VALUES (?)', [file]);
    }
  } finally {
    await connection.query('SELECT RELEASE_LOCK(?)', ['flashcard-migrate-' + name]);
  }
}
module.exports = { databaseName, config, connect, migrate };
