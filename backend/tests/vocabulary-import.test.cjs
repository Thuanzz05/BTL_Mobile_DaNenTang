const test = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const mysql = require('mysql2/promise');
const { connect, migrate } = require('../scripts/database-tools');
const { seedDatabase } = require('../scripts/seed-database');
const {
  loadVocabulary,
  validateVocabulary,
  importVocabulary,
} = require('../scripts/import-vocabulary');

test('vocabulary has 500 unique entries with valid API fields and bilingual examples', () => {
  const { wordSchema } = require('../dist/validations/request.schemas');
  const topics = loadVocabulary();
  assert.equal(topics.flatMap((topic) => topic.words).length, 500);
  for (const topic of topics) {
    for (const [english, ipa, part, meaning, exampleEnglish, exampleVietnamese] of topic.words) {
      wordSchema.parse({
        chu_de_id: 'topic-test',
        tu_tieng_anh: english,
        phien_am: ipa,
        loai_tu: part,
        nghia_tieng_viet: meaning,
        vi_du: [{ cau_tieng_anh: exampleEnglish, cau_tieng_viet: exampleVietnamese }],
      });
    }
  }
  const duplicate = structuredClone(topics);
  duplicate[1].words[0][0] = duplicate[0].words[0][0].toUpperCase();
  assert.throws(() => validateVocabulary(duplicate), /bị trùng/);
  const invalid = structuredClone(topics);
  invalid[0].words[0][2] = 'invalid-type';
  assert.throws(() => validateVocabulary(invalid), /loại từ/);
});

test(
  'vocabulary import rolls back on failure, preserves existing data and is repeatable',
  { timeout: 60000 },
  async () => {
    const db = await connect();
    const name = 'flashcard_test_' + randomBytes(8).toString('hex');
    let owned = false;
    try {
      await db.query(
        'CREATE DATABASE ' +
          mysql.escapeId(name) +
          ' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
      );
      owned = true;
      await migrate(db, name);
      await seedDatabase(db);
      const tables = [
        'chu_de',
        'tu_vung',
        'vi_du',
        'nguoi_dung',
        'phien_hoc_tap',
        'ket_qua_hoc',
        'tien_do_tu_vung',
        'yeu_thich',
      ];
      const before = {};
      for (const table of tables) {
        [before[table]] = await db.query('SELECT * FROM ??', [table]);
      }
      const preview = await importVocabulary(db, { dryRun: true });
      assert.deepEqual(preview.added, { topics: 11, words: 500, examples: 500 });
      const [[unchanged]] = await db.query('SELECT COUNT(*) AS count FROM tu_vung');
      assert.equal(unchanged.count, before.tu_vung.length);

      // Fail near the end, after earlier topics/words/examples have already been inserted.
      await db.query(`CREATE TRIGGER fail_vocabulary BEFORE INSERT ON vi_du FOR EACH ROW
      BEGIN
        IF NEW.cau_tieng_anh = 'Gardening is my favorite hobby.' THEN
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'simulated vocabulary failure';
        END IF;
      END`);
      await assert.rejects(importVocabulary(db), /simulated vocabulary failure/);
      for (const table of tables) {
        const [rows] = await db.query('SELECT * FROM ??', [table]);
        assert.deepEqual(rows, before[table], table + ' changed after rollback');
      }
      await db.query('DROP TRIGGER fail_vocabulary');

      const result = await importVocabulary(db);
      assert.deepEqual(result.added, preview.added);
      assert.equal(result.after.words, before.tu_vung.length + 500);
      for (const table of tables) {
        const [rows] = await db.query('SELECT * FROM ??', [table]);
        if (['chu_de', 'tu_vung', 'vi_du'].includes(table)) {
          const byId = new Map(rows.map((row) => [row.id, row]));
          for (const row of before[table]) {
            assert.deepEqual(byId.get(row.id), row, table + ' overwrote existing content');
          }
        } else {
          assert.deepEqual(rows, before[table], table + ' changed during vocabulary import');
        }
      }

      // Keep user edits and hidden status on subsequent runs, including case-only edits.
      await db.query(
        "UPDATE tu_vung SET tu_tieng_anh = 'HELLO', nghia_tieng_viet = 'Lời chào đã biên tập', trang_thai = 'inactive' WHERE tu_tieng_anh = 'hello'"
      );
      const second = await importVocabulary(db);
      assert.deepEqual(second.added, { topics: 0, words: 0, examples: 0 });
      assert.equal(second.skipped.length, 500);
      const [[edited]] = await db.query(
        "SELECT nghia_tieng_viet, trang_thai FROM tu_vung WHERE tu_tieng_anh = 'hello'"
      );
      assert.equal(edited.nghia_tieng_viet, 'Lời chào đã biên tập');
      assert.equal(edited.trang_thai, 'inactive');
      await db.query(
        "UPDATE tu_vung SET tu_tieng_anh = 'hello there' WHERE tu_tieng_anh = 'hello'"
      );
      await db.query("UPDATE chu_de SET ten = 'Trang phục đã biên tập' WHERE ten = 'Quần áo'");
      const renamed = await importVocabulary(db);
      assert.deepEqual(renamed.added, { topics: 0, words: 0, examples: 0 });
    } finally {
      if (owned && /^flashcard_test_[a-f0-9]{16}$/.test(name)) {
        await db.query('DROP DATABASE ' + mysql.escapeId(name));
      }
      await db.end();
    }
  }
);
