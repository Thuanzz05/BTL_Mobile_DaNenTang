const test = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs/promises');
const mysql = require('mysql2/promise');
const { connect, migrate } = require('../scripts/database-tools');

test('SRS, business calendar and JWT validation', () => {
  process.env.JWT_SECRET = randomBytes(48).toString('hex');
  process.env.REFRESH_TOKEN_SECRET = randomBytes(48).toString('hex');
  const { nextReviewDate } = require('../dist/utils/srs.util');
  const { learningPeriodStarts } = require('../dist/utils/calendar.util');
  const { JwtUtil } = require('../dist/utils/jwt.util');
  const now = new Date('2026-09-13T10:00:00Z');
  assert.equal(nextReviewDate('chua-nho', 1, now).toISOString(), now.toISOString());
  for (const [index, days] of [1, 3, 7, 14, 30, 30].entries()) {
    assert.equal((nextReviewDate('da-nho', index + 1, now) - now) / 86400000, days);
  }
  assert.equal((nextReviewDate('chua-chac', 9, now) - now) / 86400000, 1);
  const dates = learningPeriodStarts(new Date('2026-09-13T18:00:00Z'));
  assert.equal(dates.today.toISOString(), '2026-09-13T17:00:00.000Z');
  assert.equal(dates.week.toISOString(), dates.today.toISOString());
  assert.equal(dates.month.toISOString(), '2026-08-31T17:00:00.000Z');
  JwtUtil.validateConfig();
  const payload = { id: 'test', email: 'test@example.com', vai_tro: 'user', token_version: 0 };
  const pair = JwtUtil.generateTokenPair(payload);
  assert.equal(JwtUtil.verifyAccessToken(pair.accessToken).id, payload.id);
  assert.equal(JwtUtil.verifyAccessToken(pair.refreshToken), null);
  assert.equal(JwtUtil.verifyRefreshToken(pair.accessToken), null);
  assert.equal(JwtUtil.verifyAccessToken(pair.accessToken + 'broken'), null);
  const key = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;
  assert.throws(() => JwtUtil.validateConfig(), /JWT_SECRET/);
  process.env.JWT_SECRET = key;
});

test('Backend HTTP and real MySQL regression tests', { timeout: 120000 }, async (t) => {
  const connection = await connect();
  const name = 'flashcard_test_' + randomBytes(8).toString('hex');
  const uploadDirectory = path.resolve(__dirname, '../uploads', name);
  let owned = false;
  let server;
  let pool;
  try {
    // A fresh, uniquely named database is owned only after CREATE succeeds.
    await connection.query(
      'CREATE DATABASE ' +
        mysql.escapeId(name) +
        ' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
    );
    owned = true;
    await t.test('word visibility migration preserves existing content and is repeatable', () =>
      require('./word-visibility-integration.cjs').verifyUpgrade(connection, name)
    );
    await migrate(connection, name);
    await migrate(connection, name);
    process.env.DB_NAME = name;
    process.env.UPLOAD_DIR = uploadDirectory;
    process.env.NODE_ENV = 'test';
    process.env.RATE_LIMIT_MAX_REQUESTS = '10000';
    const app = require('../dist/app').default;
    pool = require('../dist/config/database').default;
    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    const base = 'http://127.0.0.1:' + server.address().port;
    async function api(method, route, body, token, expected = 200) {
      const headers = {};
      if (token) {
        headers.Authorization = 'Bearer ' + token;
      }
      if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
      }
      const response = await fetch(base + route, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      });
      const json = await response.json();
      assert.equal(response.status, expected, method + ' ' + route + ': ' + JSON.stringify(json));
      return json.data;
    }
    const register = (email) =>
      api(
        'POST',
        '/api/auth/register',
        { ho_ten: 'Người kiểm thử', email, mat_khau: 'Test123456' },
        undefined,
        201
      );
    const login = (email) => api('POST', '/api/auth/login', { email, mat_khau: 'Test123456' });
    let admin,
      learner,
      other,
      learnerId,
      topic,
      hidden,
      words = [],
      session,
      chosen;

    await t.test('auth routes, validation and permissions', async () => {
      assert.equal((await api('GET', '/')).api, '/api');
      await api('GET', '/health');
      await api('GET', '/ready');
      await api(
        'POST',
        '/api/auth/register',
        { ho_ten: 5, email: 'bad', mat_khau: '123' },
        undefined,
        400
      );
      await register('admin@test.local');
      const user = await register('learner@test.local');
      learnerId = user.id;
      await register('other@test.local');
      await api(
        'POST',
        '/api/auth/register',
        { ho_ten: 'Trùng tên', email: 'learner@test.local', mat_khau: 'Test123456' },
        undefined,
        409
      );
      await connection.execute(
        "UPDATE nguoi_dung SET vai_tro = 'admin' WHERE email = 'admin@test.local'"
      );
      admin = await login('admin@test.local');
      learner = await login('learner@test.local');
      other = await login('other@test.local');
      await api(
        'POST',
        '/api/auth/login',
        { email: 'learner@test.local', mat_khau: 'Wrong123456' },
        undefined,
        401
      );
      assert.equal(
        (await api('GET', '/api/auth/me', undefined, learner.accessToken)).id,
        learnerId
      );
      assert.equal(
        (await api('PUT', '/api/auth/profile', { ho_ten: 'Tên mới' }, learner.accessToken)).ho_ten,
        'Tên mới'
      );
      assert.equal(
        (await api('PUT', '/api/auth/profile', { muc_tieu_hang_ngay: 5 }, learner.accessToken))
          .muc_tieu_hang_ngay,
        5
      );
      await api('PUT', '/api/auth/profile', { muc_tieu_hang_ngay: 7 }, learner.accessToken, 400);
      assert.equal(
        (await api('GET', '/api/home/dashboard', undefined, learner.accessToken)).tien_do_hom_nay
          .muc_tieu,
        5
      );
      await api('POST', '/api/auth/refresh', { refreshToken: learner.refreshToken });
      await api('GET', '/api/admin/dashboard', undefined, learner.accessToken, 403);
      await api('GET', '/api/progress', undefined, undefined, 401);
      await api('GET', '/api/words?page=-1', undefined, undefined, 400);
      await api('GET', '/api/history?limit=abc', undefined, learner.accessToken, 400);
    });

    await t.test('catalog CRUD, example editing and hidden topics', async () => {
      topic = await api('POST', '/api/admin/topics', { ten: 'Chủ đề thử' }, admin.accessToken, 201);
      hidden = await api(
        'POST',
        '/api/admin/topics',
        { ten: 'Chủ đề ẩn', trang_thai: 'inactive' },
        admin.accessToken,
        201
      );
      for (let i = 0; i < 7; i++) {
        words.push(
          await api(
            'POST',
            '/api/admin/words',
            {
              chu_de_id: topic.id,
              tu_tieng_anh: 'Word' + i,
              nghia_tieng_viet: 'Từ ' + i,
              loai_tu: 'danh-tu',
              vi_du: [{ cau_tieng_anh: 'Example', cau_tieng_viet: 'Ví dụ' }],
            },
            admin.accessToken,
            201
          )
        );
      }
      const hiddenWord = await api(
        'POST',
        '/api/admin/words',
        {
          chu_de_id: hidden.id,
          tu_tieng_anh: 'Hidden',
          nghia_tieng_viet: 'Ẩn',
          loai_tu: 'danh-tu',
        },
        admin.accessToken,
        201
      );
      await api('GET', '/api/words/' + hiddenWord.id, undefined, learner.accessToken, 404);
      await api('GET', '/api/topics/' + hidden.id, undefined, undefined, 404);
      assert.equal(
        (await api('GET', '/api/topics?status=inactive')).some((item) => item.id === hidden.id),
        false
      );
      const updated = await api(
        'PUT',
        '/api/admin/words/' + words[0].id,
        {
          vi_du: [{ cau_tieng_anh: 'New example', cau_tieng_viet: 'Ví dụ mới' }],
        },
        admin.accessToken
      );
      assert.equal(updated.vi_du[0].cau_tieng_anh, 'New example');
      const filtered = await api(
        'GET',
        '/api/admin/words?topicId=' + topic.id + '&search=Word0&limit=1',
        undefined,
        admin.accessToken
      );
      assert.equal(filtered.items.length, 1);
      assert.equal(filtered.pagination.total, 1);
      await api('DELETE', '/api/admin/topics/' + topic.id, undefined, admin.accessToken, 409);
    });

    await t.test(
      'favorite IDs, idempotent PUT, personalized reads and empty progress',
      async () => {
        await api('PUT', '/api/favorites/' + words[0].id, undefined, learner.accessToken);
        await api('PUT', '/api/favorites/' + words[0].id, undefined, learner.accessToken);
        const favorites = await api('GET', '/api/favorites', undefined, learner.accessToken);
        assert.equal(favorites.length, 1);
        assert.ok(favorites[0].yeu_thich_id);
        assert.equal(
          Number(
            (await api('GET', '/api/words/' + words[0].id, undefined, learner.accessToken))
              .da_yeu_thich
          ),
          1
        );
        assert.equal(
          Number(
            (await api('GET', '/api/words/' + words[0].id, undefined, other.accessToken))
              .da_yeu_thich
          ),
          0
        );
        assert.equal(
          (await api('GET', '/api/progress', undefined, learner.accessToken)).tong_so_tu_da_hoc,
          0
        );
        await api('DELETE', '/api/favorites/' + words[0].id, undefined, learner.accessToken);
        await api('DELETE', '/api/favorites/' + words[0].id, undefined, learner.accessToken);
      }
    );

    await t.test('session membership, incomplete completion and concurrent retries', async () => {
      await api(
        'POST',
        '/api/learning/start',
        { chu_de_id: topic.id, tong_so_tu: 'bad' },
        learner.accessToken,
        400
      );
      await api(
        'POST',
        '/api/learning/start',
        { chu_de_id: hidden.id, tong_so_tu: 5 },
        learner.accessToken,
        404
      );
      session = await api(
        'POST',
        '/api/learning/start',
        { chu_de_id: topic.id, tong_so_tu: 5 },
        learner.accessToken,
        201
      );
      chosen = session.danh_sach_tu;
      assert.equal(chosen.length, 5);
      const outside = words.find((word) => !chosen.some((selected) => selected.id === word.id));
      const result = (wordId, status = 'da-nho') => ({
        phien_hoc_tap_id: session.phien_hoc_tap_id,
        tu_vung_id: wordId,
        trang_thai: status,
      });
      await api('POST', '/api/learning/result', result(chosen[0].id), other.accessToken, 404);
      await api('POST', '/api/learning/result', result(outside.id), learner.accessToken, 400);
      await api(
        'POST',
        '/api/learning/complete',
        { phien_hoc_tap_id: session.phien_hoc_tap_id },
        learner.accessToken,
        409
      );
      await api('DELETE', '/api/admin/words/' + chosen[0].id, undefined, admin.accessToken, 409);
      const retries = await Promise.all(
        Array.from({ length: 4 }, () =>
          api('POST', '/api/learning/result', result(chosen[0].id), learner.accessToken)
        )
      );
      assert.equal(retries.filter((item) => !item.replayed).length, 1);
      const [[progress]] = await connection.execute(
        'SELECT so_lan_on_tap FROM tien_do_tu_vung WHERE nguoi_dung_id = ? AND tu_vung_id = ?',
        [learnerId, chosen[0].id]
      );
      assert.equal(progress.so_lan_on_tap, 1);
      await api(
        'POST',
        '/api/learning/result',
        result(chosen[0].id, 'chua-nho'),
        learner.accessToken,
        409
      );
      for (let i = 1; i < chosen.length; i++) {
        await api(
          'POST',
          '/api/learning/result',
          result(chosen[i].id, i === 1 ? 'chua-nho' : 'da-nho'),
          learner.accessToken
        );
      }
      const completed = await api(
        'POST',
        '/api/learning/complete',
        { phien_hoc_tap_id: session.phien_hoc_tap_id },
        learner.accessToken
      );
      assert.equal(completed.ty_le, 80);
      assert.deepEqual(
        await api(
          'POST',
          '/api/learning/complete',
          { phien_hoc_tap_id: session.phien_hoc_tap_id },
          learner.accessToken
        ),
        completed
      );
      await api('POST', '/api/learning/result', result(chosen[0].id), learner.accessToken);
      const [[activities]] = await connection.execute(
        'SELECT COUNT(*) AS count FROM hoat_dong_hoc_tap WHERE nguoi_dung_id = ?',
        [learnerId]
      );
      assert.equal(activities.count, 1);
      const progressSummary = await api('GET', '/api/progress', undefined, learner.accessToken);
      assert.equal(progressSummary.tong_so_tu_da_hoc, 5);
      assert.equal(progressSummary.hom_nay, 5);
      assert.equal(progressSummary.ty_le, 80);
      const resume = await api(
        'GET',
        '/api/learning/result/' + session.phien_hoc_tap_id,
        undefined,
        learner.accessToken
      );
      assert.deepEqual(
        resume.danh_sach_tu.map((word) => word.id),
        chosen.map((word) => word.id)
      );
    });

    await t.test('due remembered words, review session, dashboard and review history', async () => {
      await connection.execute(
        'UPDATE tien_do_tu_vung SET ngay_on_tap_tiep_theo = DATE_SUB(NOW(), INTERVAL 1 DAY) WHERE nguoi_dung_id = ? AND tu_vung_id = ?',
        [learnerId, chosen[0].id]
      );
      const review = await api(
        'GET',
        '/api/learning/review?limit=1',
        undefined,
        learner.accessToken
      );
      assert.equal(review.so_tu_can_on, 2);
      assert.equal(review.danh_sach_tu.length, 1);
      assert.equal(review.danh_sach_tu[0].id, chosen[0].id);
      assert.equal(
        (await api('GET', '/api/progress/review?limit=1', undefined, learner.accessToken))
          .so_tu_can_on,
        2
      );
      assert.equal(
        (await api('GET', '/api/home/dashboard', undefined, learner.accessToken)).so_tu_can_on,
        2
      );
      const reviewSession = await api(
        'POST',
        '/api/learning/review/start',
        { tong_so_tu: 2 },
        learner.accessToken,
        201
      );
      assert.equal(reviewSession.phien_hoc_tap.loai_phien, 'on_tap');
      for (const word of reviewSession.danh_sach_tu) {
        await api(
          'POST',
          '/api/learning/result',
          {
            phien_hoc_tap_id: reviewSession.phien_hoc_tap_id,
            tu_vung_id: word.id,
            trang_thai: 'da-nho',
          },
          learner.accessToken
        );
      }
      await api(
        'POST',
        '/api/learning/complete',
        { phien_hoc_tap_id: reviewSession.phien_hoc_tap_id },
        learner.accessToken
      );
      const history = await api('GET', '/api/history', undefined, learner.accessToken);
      assert.ok(history.items.some((item) => item.id === reviewSession.phien_hoc_tap_id));
      await api(
        'GET',
        '/api/history/' + reviewSession.phien_hoc_tap_id,
        undefined,
        learner.accessToken
      );
      await api(
        'GET',
        '/api/history/' + reviewSession.phien_hoc_tap_id,
        undefined,
        other.accessToken,
        404
      );
      await api('POST', '/api/learning/review/start', {}, other.accessToken, 404);
    });

    await t.test('result and progress roll back together when the DB write fails', async () => {
      const failingSession = await api(
        'POST',
        '/api/learning/start',
        { chu_de_id: topic.id, tong_so_tu: 5 },
        other.accessToken,
        201
      );
      // A temporary trigger in the isolated database simulates a storage failure after inserting the result.
      await connection.query(`CREATE TRIGGER test_fail_progress BEFORE INSERT ON tien_do_tu_vung
        FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'simulated test storage failure'`);
      try {
        await api(
          'POST',
          '/api/learning/result',
          {
            phien_hoc_tap_id: failingSession.phien_hoc_tap_id,
            tu_vung_id: failingSession.danh_sach_tu[0].id,
            trang_thai: 'da-nho',
          },
          other.accessToken,
          500
        );
        const [[count]] = await connection.execute(
          'SELECT COUNT(*) AS count FROM ket_qua_hoc WHERE phien_hoc_tap_id = ?',
          [failingSession.phien_hoc_tap_id]
        );
        assert.equal(count.count, 0);
      } finally {
        await connection.query('DROP TRIGGER test_fail_progress');
      }
    });

    await t.test('upload permission, format and file size', async () => {
      const png = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jVx8AAAAASUVORK5CYII=',
        'base64'
      );
      async function upload(bytes, token, mime, status) {
        const form = new FormData();
        form.append('file', new Blob([bytes], { type: mime }), '../../unsafe.png');
        const response = await fetch(base + '/api/admin/upload/image', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token },
          body: form,
        });
        const json = await response.json();
        assert.equal(response.status, status, JSON.stringify(json));
        return json.data;
      }
      await upload(png, learner.accessToken, 'image/png', 403);
      await upload(Buffer.from('this is not an image'), admin.accessToken, 'image/png', 400);
      await upload(Buffer.alloc(2 * 1024 * 1024 + 1), admin.accessToken, 'image/png', 413);
      const result = await upload(png, admin.accessToken, 'image/png', 201);
      assert.match(result.url, /^\/uploads\/images\/[a-f0-9-]+\.png$/);
      const response = await fetch(base + result.url);
      assert.equal(response.status, 200);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), png);
    });

    await require('./quiz-integration.cjs')(t, { api, connection, admin, learner, other, base });
    await require('./word-visibility-integration.cjs').verifyBehavior(t, {
      api,
      connection,
      admin,
    });

    await t.test(
      'locked and unlocked accounts cannot reuse old access or refresh tokens',
      async () => {
        await api(
          'PUT',
          '/api/admin/users/' + learnerId + '/status',
          { trang_thai: 'locked' },
          admin.accessToken
        );
        await api('GET', '/api/auth/profile', undefined, learner.accessToken, 403);
        await api(
          'POST',
          '/api/auth/refresh',
          { refreshToken: learner.refreshToken },
          undefined,
          403
        );
        await api(
          'PUT',
          '/api/admin/users/' + learnerId + '/status',
          { trang_thai: 'active' },
          admin.accessToken
        );
        await api('GET', '/api/auth/profile', undefined, learner.accessToken, 401);
        await api(
          'POST',
          '/api/auth/refresh',
          { refreshToken: learner.refreshToken },
          undefined,
          401
        );
        learner = await login('learner@test.local');
        await api(
          'POST',
          '/api/auth/change-password',
          { mat_khau_cu: 'Test123456', mat_khau_moi: 'New123456' },
          learner.accessToken
        );
        await api('GET', '/api/progress', undefined, learner.accessToken, 401);
        await api(
          'POST',
          '/api/auth/refresh',
          { refreshToken: learner.refreshToken },
          undefined,
          401
        );
        learner = await api('POST', '/api/auth/login', {
          email: 'learner@test.local',
          mat_khau: 'New123456',
        });
        await api(
          'POST',
          '/api/auth/logout',
          { refreshToken: learner.refreshToken },
          learner.accessToken
        );
        await api(
          'POST',
          '/api/auth/refresh',
          { refreshToken: learner.refreshToken },
          undefined,
          401
        );
      }
    );
    await t.test(
      'migration preserves existing sessions, results and account versions',
      async () => {
        const legacyId = 'legacy-' + randomBytes(10).toString('hex');
        const legacyResultId = 'result-' + randomBytes(10).toString('hex');

        await connection.execute(
          "INSERT INTO phien_hoc_tap (id, nguoi_dung_id, chu_de_id, tong_so_tu, trang_thai) VALUES (?, ?, ?, 1, 'hoan-thanh')",
          [legacyId, learnerId, topic.id]
        );
        await connection.execute(
          "INSERT INTO ket_qua_hoc (id, phien_hoc_tap_id, tu_vung_id, trang_thai) VALUES (?, ?, ?, 'da-nho')",
          [legacyResultId, legacyId, words[0].id]
        );

        const [[before]] = await connection.execute(
          'SELECT token_version FROM nguoi_dung WHERE id = ?',
          [learnerId]
        );
        await connection.query('DELETE FROM schema_migrations');
        await migrate(connection, name);
        await migrate(connection, name);

        const [[after]] = await connection.execute(
          'SELECT token_version FROM nguoi_dung WHERE id = ?',
          [learnerId]
        );
        assert.equal(after.token_version, before.token_version);

        const [[result]] = await connection.execute(
          'SELECT id, trang_thai FROM ket_qua_hoc WHERE id = ?',
          [legacyResultId]
        );
        assert.equal(result.id, legacyResultId);
        assert.equal(result.trang_thai, 'da-nho');

        const [[membership]] = await connection.execute(
          'SELECT tu_vung_id FROM phien_hoc_tu WHERE phien_hoc_tap_id = ?',
          [legacyId]
        );
        assert.equal(membership.tu_vung_id, words[0].id);
      }
    );

    await t.test('Swagger documents newly connected routes and actual auth fields', async () => {
      const response = await fetch(base + '/api-docs.json');
      const document = await response.json();
      assert.equal(response.status, 200);

      for (const route of [
        '/api/auth/refresh',
        '/api/auth/change-password',
        '/api/progress',
        '/api/home/dashboard',
        '/api/learning/review/start',
        '/api/admin/upload/image',
      ]) {
        assert.ok(document.paths[route], route + ' is missing from Swagger');
      }

      const body =
        document.paths['/api/auth/register'].post.requestBody.content['application/json'].schema;
      assert.deepEqual(body.required, ['ho_ten', 'email', 'mat_khau']);
    });
  } finally {
    if (server) {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
    if (pool) {
      await pool.end();
    }
    if (owned && /^flashcard_test_[a-f0-9]{16}$/.test(name)) {
      await connection.query('DROP DATABASE ' + mysql.escapeId(name));
    }
    await connection.end();
    const expectedRoot = path.resolve(__dirname, '../uploads') + path.sep;
    if (uploadDirectory.startsWith(expectedRoot) && path.basename(uploadDirectory) === name) {
      await fs.rm(uploadDirectory, { recursive: true, force: true });
    }
  }
});

test(
  'seed is transactional, creates usable demo accounts and preserves existing data',
  { timeout: 30000 },
  async () => {
    const { seedDatabase } = require('../scripts/seed-database');
    const bcrypt = require('bcrypt');
    const connection = await connect();
    const name = 'flashcard_test_' + randomBytes(8).toString('hex');
    let owned = false;

    try {
      await connection.query(
        'CREATE DATABASE ' +
          mysql.escapeId(name) +
          ' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
      );
      owned = true;
      await migrate(connection, name);

      await connection.query(`CREATE TRIGGER fail_seed BEFORE INSERT ON tu_vung
      FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'simulated seed failure'`);

      await assert.rejects(seedDatabase(connection), /simulated seed failure/);

      const [[empty]] = await connection.query('SELECT COUNT(*) AS count FROM nguoi_dung');
      assert.equal(empty.count, 0);
      await connection.query('DROP TRIGGER fail_seed');

      await seedDatabase(connection);

      const [users] = await connection.query(
        "SELECT vai_tro, mat_khau_hash FROM nguoi_dung WHERE phuong_thuc_dang_nhap = 'local'"
      );
      for (const user of users) {
        assert.equal(
          await bcrypt.compare(
            user.vai_tro === 'admin' ? 'admin123' : 'user123',
            user.mat_khau_hash
          ),
          true
        );
      }

      const [sessions] = await connection.query(`SELECT p.tong_so_tu, COUNT(m.tu_vung_id) AS saved
      FROM phien_hoc_tap p LEFT JOIN phien_hoc_tu m ON p.id = m.phien_hoc_tap_id GROUP BY p.id`);
      for (const session of sessions) {
        assert.equal(Number(session.saved), session.tong_so_tu);
      }

      await assert.rejects(seedDatabase(connection), /Database đã có dữ liệu/);
      const [[after]] = await connection.query('SELECT COUNT(*) AS count FROM nguoi_dung');
      assert.equal(after.count, 4);
    } finally {
      if (owned && /^flashcard_test_[a-f0-9]{16}$/.test(name)) {
        await connection.query('DROP DATABASE ' + mysql.escapeId(name));
      }
      await connection.end();
    }
  }
);
