const test = require('node:test');
const assert = require('node:assert/strict');
const {
  splitSql,
  parseDatabaseSource,
  readDatabaseSource,
  businessTables,
} = require('../scripts/sql-source');

test('SQL source keeps quoted delimiters and separates schema from demo data', () => {
  const source = readDatabaseSource();
  assert.equal(source.schema.length, businessTables.length);
  assert.ok(source.schema.every((sql) => sql.startsWith('CREATE TABLE IF NOT EXISTS ')));
  assert.ok(source.seed.every((sql) => sql.startsWith('INSERT INTO ')));
  const statements = splitSql(
    " -- heading\nINSERT INTO vi_du VALUES ('a;--b', 'it''s fine'); /* comment */ SELECT 1; # end"
  );
  assert.deepEqual(statements, ["INSERT INTO vi_du VALUES ('a;--b', 'it''s fine')", 'SELECT 1']);
  assert.throws(() => splitSql("SELECT 'unclosed"), /chưa đóng/);
  assert.throws(() => splitSql('/* unclosed'), /chưa đóng/);
  const valid = source.schema.concat(source.seed).join(';');
  assert.throws(
    () => parseDatabaseSource(valid + '; DROP DATABASE hoc_tu_vung;'),
    /không được phép/
  );
  assert.throws(() => parseDatabaseSource(valid + '; TRUNCATE nguoi_dung;'), /không được phép/);
});
