const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { v5: uuid } = require('uuid');
const { connect, databaseName } = require('./database-tools');

const DATA_DIRECTORY = path.join(__dirname, '../data/vocabulary-500');
// Giữ namespace cũ để nhận ra các từ đã nạp, kể cả sau khi admin đổi tên.
const NAMESPACE = 'c88ad4a3-37b7-4dcf-8376-1975b2597c1d';
const WORD_TYPES = new Set([
  'danh-tu',
  'dong-tu',
  'tinh-tu',
  'trang-tu',
  'gioi-tu',
  'lien-tu',
  'dai-tu',
  'tham-tu',
]);

function normalize(value) {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/\p{M}/gu, '')
    .replace(/đ/g, 'd')
    .trim()
    .replace(/\s+/g, ' ');
}

function validateText(value, maximum, label) {
  if (
    typeof value !== 'string' ||
    !value.trim() ||
    value !== value.trim() ||
    value.length > maximum ||
    value.includes('\uFFFD')
  ) {
    throw new Error(`${label} không hợp lệ`);
  }
}

function validateVocabulary(topics) {
  if (!Array.isArray(topics) || topics.length !== 20) {
    throw new Error('Bộ dữ liệu phải có đúng 20 chủ đề');
  }

  const keys = new Set();
  const names = new Set();
  const words = new Set();

  for (const topic of topics) {
    validateText(topic?.key, 80, 'Mã chủ đề');
    validateText(topic.ten, 255, 'Tên chủ đề');
    validateText(topic.mo_ta, 5000, 'Mô tả chủ đề');
    if (!/^[a-z][a-z0-9-]*$/.test(topic.key)) {
      throw new Error(`Mã chủ đề không hợp lệ: ${topic.key}`);
    }
    if (keys.has(topic.key) || names.has(normalize(topic.ten))) {
      throw new Error(`Chủ đề bị trùng: ${topic.ten}`);
    }
    keys.add(topic.key);
    names.add(normalize(topic.ten));

    if (!Array.isArray(topic.words) || topic.words.length !== 25) {
      throw new Error(`Chủ đề ${topic.ten} phải có đúng 25 từ`);
    }

    for (const row of topic.words) {
      if (!Array.isArray(row) || row.length !== 6) {
        throw new Error(`Mục từ trong ${topic.ten} phải có đủ 6 trường`);
      }
      const limits = [120, 120, 30, 255, 5000, 5000];
      row.forEach((value, index) => validateText(value, limits[index], `Trường ${index + 1}`));
      const [english, ipa, type] = row;
      if (!/^[a-zA-Z]+(?:[ -][a-zA-Z]+)*$/.test(english)) {
        throw new Error(`Từ tiếng Anh không hợp lệ: ${english}`);
      }
      if (!/^\/[^/\d]+\/$/.test(ipa)) {
        throw new Error(`Phiên âm không hợp lệ: ${english}`);
      }
      if (!WORD_TYPES.has(type)) {
        throw new Error(`Sai loại từ: ${english} (${type})`);
      }
      if (words.has(normalize(english))) {
        throw new Error(`Từ vựng bị trùng: ${english}`);
      }
      words.add(normalize(english));
    }
  }
  return topics;
}

function loadVocabulary() {
  const topics = fs
    .readdirSync(DATA_DIRECTORY)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .flatMap((file) => JSON.parse(fs.readFileSync(path.join(DATA_DIRECTORY, file), 'utf8')));

  return validateVocabulary(topics);
}

function planImport(topics, catalog) {
  const plan = { topics: [], words: [], examples: [], skipped: [] };
  const wordIds = new Set(catalog.tu_vung.map((word) => word.id));
  const wordNames = new Set(catalog.tu_vung.map((word) => normalize(word.tu_tieng_anh)));
  let topicOrder = Math.max(0, ...catalog.chu_de.map((topic) => topic.thu_tu_hien_thi));

  for (const topic of topics) {
    const stableTopicId = uuid('topic:' + topic.key, NAMESPACE);
    const matches = catalog.chu_de.filter(
      (existing) =>
        existing.id === stableTopicId || normalize(existing.ten) === normalize(topic.ten)
    );
    if (matches.length > 1) {
      throw new Error(`Có nhiều chủ đề khớp với ${topic.ten}; cần xử lý trùng trước khi nạp`);
    }

    const pending = topic.words.filter(([english]) => {
      if (
        wordIds.has(uuid('word:' + normalize(english), NAMESPACE)) ||
        wordNames.has(normalize(english))
      ) {
        plan.skipped.push(english);
        return false;
      }
      return true;
    });
    // Không tạo chủ đề rỗng nếu tất cả từ đã có ở chủ đề khác.
    if (!pending.length) {
      continue;
    }

    const topicId = matches[0]?.id || stableTopicId;
    if (!matches.length) {
      plan.topics.push({
        id: topicId,
        ten: topic.ten,
        mo_ta: topic.mo_ta,
        trang_thai: 'active',
        thu_tu_hien_thi: ++topicOrder,
      });
    }
    let wordOrder = Math.max(
      0,
      ...catalog.tu_vung
        .filter((word) => word.chu_de_id === topicId)
        .map((word) => word.thu_tu_hien_thi)
    );

    for (const [english, ipa, type, meaning, exampleEnglish, exampleVietnamese] of pending) {
      const wordId = uuid('word:' + normalize(english), NAMESPACE);
      plan.words.push({
        id: wordId,
        chu_de_id: topicId,
        tu_tieng_anh: english,
        phien_am: ipa,
        loai_tu: type,
        nghia_tieng_viet: meaning,
        trang_thai: 'active',
        thu_tu_hien_thi: ++wordOrder,
      });
      plan.examples.push({
        id: uuid('example:' + normalize(english), NAMESPACE),
        tu_vung_id: wordId,
        cau_tieng_anh: exampleEnglish,
        cau_tieng_viet: exampleVietnamese,
        thu_tu_hien_thi: 0,
      });
      wordIds.add(wordId);
      wordNames.add(normalize(english));
    }
  }
  return plan;
}

async function saveBackup(directory, database, catalog) {
  await fs.promises.mkdir(directory, { recursive: true });
  const createdAt = new Date().toISOString();
  const filename = path.join(
    directory,
    `vocabulary-before-${createdAt.replace(/[:.]/g, '-')}.json`
  );
  await fs.promises.writeFile(
    filename,
    JSON.stringify({ database, createdAt, tables: catalog }, null, 2),
    { encoding: 'utf8', flag: 'wx' }
  );
  return filename;
}

async function writePlan(connection, plan) {
  for (const [table, rows] of [
    ['chu_de', plan.topics],
    ['tu_vung', plan.words],
    ['vi_du', plan.examples],
  ]) {
    for (const row of rows) {
      await connection.query('INSERT INTO ?? SET ?', [table, row]);
    }
  }
}

async function importVocabulary(connection, { dryRun = false, backupDirectory } = {}) {
  const topics = loadVocabulary();
  const [[selected]] = await connection.query('SELECT DATABASE() AS name');
  if (!selected.name) {
    throw new Error('Cần chọn database đã chạy db:migrate trước khi nạp từ vựng');
  }

  const lockName =
    'vocabulary-' + createHash('sha256').update(selected.name).digest('hex').slice(0, 40);
  const [[lock]] = await connection.query('SELECT GET_LOCK(?, 10) AS acquired', [lockName]);
  if (Number(lock.acquired) !== 1) {
    throw new Error('Một tiến trình khác đang nạp từ vựng');
  }

  try {
    await connection.beginTransaction();
    // Khóa các bản ghi trong lúc lập kế hoạch để không ghi đè thay đổi của admin.
    const catalog = {};
    for (const table of ['chu_de', 'tu_vung', 'vi_du']) {
      [catalog[table]] = await connection.query('SELECT * FROM ?? FOR UPDATE', [table]);
    }
    const plan = planImport(topics, catalog);
    const before = {
      topics: catalog.chu_de.length,
      words: catalog.tu_vung.length,
      examples: catalog.vi_du.length,
    };
    const added = {
      topics: plan.topics.length,
      words: plan.words.length,
      examples: plan.examples.length,
    };
    const after = {
      topics: before.topics + added.topics,
      words: before.words + added.words,
      examples: before.examples + added.examples,
    };
    let backup = null;

    if (dryRun) {
      await connection.rollback();
    } else {
      if (backupDirectory && added.words) {
        backup = await saveBackup(backupDirectory, selected.name, catalog);
      }
      await writePlan(connection, plan);
      for (const [table, key] of [
        ['chu_de', 'topics'],
        ['tu_vung', 'words'],
        ['vi_du', 'examples'],
      ]) {
        const [[result]] = await connection.query('SELECT COUNT(*) AS count FROM ??', [table]);
        if (Number(result.count) !== after[key]) {
          throw new Error(`Số lượng ${table} sau khi nạp không khớp`);
        }
      }
      await connection.commit();
    }

    return { before, added, after, skipped: plan.skipped, backup };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.query('SELECT RELEASE_LOCK(?)', [lockName]);
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--dry-run')) {
    throw new Error('Chỉ hỗ trợ tùy chọn --dry-run');
  }
  const dryRun = args.includes('--dry-run');
  const connection = await connect();

  try {
    await connection.changeUser({ database: databaseName() });
    await connection.query("SET time_zone = '+00:00'");
    const result = await importVocabulary(connection, {
      dryRun,
      backupDirectory: path.join(__dirname, '../backups'),
    });
    console.log(dryRun ? 'Xem trước, chưa ghi dữ liệu.' : 'Đã nạp từ vựng, giữ dữ liệu hiện có.');
    console.log(
      `Thêm: ${result.added.topics} chủ đề, ${result.added.words} từ, ${result.added.examples} ví dụ.`
    );
    console.log(`Bỏ qua ${result.skipped.length} từ đã có.`);
    console.log(
      `Tổng${dryRun ? ' dự kiến' : ''}: ${result.after.topics} chủ đề, ${result.after.words} từ, ${result.after.examples} ví dụ.`
    );
    if (result.backup) {
      console.log(`Bản sao danh mục: ${result.backup}`);
    }
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

module.exports = { loadVocabulary, validateVocabulary, importVocabulary };
