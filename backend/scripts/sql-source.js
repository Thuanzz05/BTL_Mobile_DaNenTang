const fs = require('node:fs');
const path = require('node:path');

const businessTables = [
  'nguoi_dung',
  'token_lam_moi',
  'ma_dat_lai_mat_khau',
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

/** Tách câu SQL, giữ nguyên dấu chấm phẩy và comment nằm trong chuỗi dữ liệu. */
function splitSql(source) {
  const statements = [];
  let current = '';
  let quote = null;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (quote) {
      current += char;

      if (char === '\\') {
        current += next || '';
        index += 1;
      } else if (char === quote) {
        if (next === quote) {
          current += next;
          index += 1;
        } else {
          quote = null;
        }
      }

      continue;
    }

    if (char === "'" || char === '"' || char === '`') {
      quote = char;
      current += char;
    } else if (
      char === '#' ||
      (char === '-' && next === '-' && /\s/.test(source[index + 2] || ' '))
    ) {
      while (index < source.length && source[index] !== '\n') {
        index += 1;
      }
      current += '\n';
    } else if (char === '/' && next === '*') {
      const end = source.indexOf('*/', index + 2);
      if (end < 0) {
        throw new Error('Comment SQL chưa đóng');
      }
      index = end + 1;
      current += ' ';
    } else if (char === ';') {
      if (current.trim()) {
        statements.push(current.trim());
      }
      current = '';
    } else {
      current += char;
    }
  }

  if (quote) {
    throw new Error('Chuỗi SQL chưa đóng');
  }
  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements;
}

/** Một nguồn SQL cho schema và seed; không thực thi lệnh chọn/xóa database trong file. */
function parseDatabaseSource(source) {
  const schema = [];
  const seed = [];

  for (const statement of splitSql(source)) {
    const table = statement.match(/^(CREATE TABLE(?: IF NOT EXISTS)?|INSERT INTO)\s+([a-z_]+)/i);

    if (table && businessTables.includes(table[2].toLowerCase())) {
      if (table[1].toUpperCase().startsWith('CREATE TABLE')) {
        schema.push(
          statement.replace(/^CREATE TABLE\s+(?:IF NOT EXISTS\s+)?/i, 'CREATE TABLE IF NOT EXISTS ')
        );
      } else {
        seed.push(statement);
      }
      continue;
    }

    // Các lệnh này chỉ phục vụ người đọc file SQL; CLI dùng DB_NAME đã kiểm tra.
    if (/^(CREATE DATABASE\b|USE\b|SELECT\b)/i.test(statement)) {
      continue;
    }

    throw new Error(
      'File SQL chứa lệnh không được phép trong bước khởi tạo: ' + statement.slice(0, 60)
    );
  }

  if (schema.length !== businessTables.length || !seed.length) {
    throw new Error('Nguồn SQL thiếu cấu trúc bảng hoặc dữ liệu mẫu');
  }

  return { schema, seed };
}

function readDatabaseSource() {
  const source = fs.readFileSync(path.join(__dirname, '../hoc_tu_vung_full.sql'), 'utf8');
  return parseDatabaseSource(source);
}

module.exports = { businessTables, splitSql, parseDatabaseSource, readDatabaseSource };
