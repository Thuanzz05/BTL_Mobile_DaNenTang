const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { readDatabaseSource } = require('../scripts/sql-source');
const { migrate } = require('../scripts/database-tools');

// Chạy trong database riêng do bộ test tạo và sở hữu.
async function verifyUpgrade(connection, database) {
  await connection.changeUser({ database });
  for (const statement of readDatabaseSource().schema) {
    await connection.query(statement);
  }
  const topicId = randomUUID();
  const wordId = randomUUID();
  await connection.execute('INSERT INTO chu_de (id, ten) VALUES (?, ?)', [topicId, 'Legacy']);
  await connection.execute(
    "INSERT INTO tu_vung (id, chu_de_id, tu_tieng_anh, nghia_tieng_viet, loai_tu) VALUES (?, ?, 'legacy', 'Từ cũ', 'danh-tu')",
    [wordId, topicId]
  );

  await migrate(connection, database);
  const [[word]] = await connection.execute('SELECT * FROM tu_vung WHERE id = ?', [wordId]);
  assert.equal(word.trang_thai, 'active');
  assert.equal(word.nghia_tieng_viet, 'Từ cũ');

  await connection.execute("UPDATE tu_vung SET trang_thai = 'inactive' WHERE id = ?", [wordId]);
  await require('../migrations/003-word-visibility')(connection);
  const [[hidden]] = await connection.execute('SELECT trang_thai FROM tu_vung WHERE id = ?', [
    wordId,
  ]);
  assert.equal(hidden.trang_thai, 'inactive');
  await connection.execute('DELETE FROM tu_vung WHERE id = ?', [wordId]);
  await connection.execute('DELETE FROM chu_de WHERE id = ?', [topicId]);
}

async function verifyBehavior(t, { api, connection, admin }) {
  await t.test(
    'word visibility filters new content while preserving learning and favorites',
    async () => {
      const credentials = { email: 'visibility@test.local', mat_khau: 'Test123456' };
      const user = await api(
        'POST',
        '/api/auth/register',
        { ...credentials, ho_ten: 'Visibility learner' },
        undefined,
        201
      );
      const learner = await api('POST', '/api/auth/login', credentials);
      const topic = await api(
        'POST',
        '/api/admin/topics',
        { ten: 'Visibility content' },
        admin.accessToken,
        201
      );
      const words = [];
      for (let index = 0; index < 8; index += 1) {
        words.push(
          await api(
            'POST',
            '/api/admin/words',
            {
              chu_de_id: topic.id,
              tu_tieng_anh: 'Visibility ' + index,
              nghia_tieng_viet: 'Nghĩa kiểm thử ẩn riêng ' + index,
              loai_tu: 'danh-tu',
              ...(index === 7 ? { trang_thai: 'inactive' } : {}),
              vi_du: [{ cau_tieng_anh: 'Keep this example.', cau_tieng_viet: 'Giữ ví dụ này.' }],
            },
            admin.accessToken,
            201
          )
        );
      }
      assert.equal(words[0].trang_thai, 'active');
      assert.equal(words[7].trang_thai, 'inactive');
      const token = learner.accessToken;
      const legacy = await api(
        'POST',
        '/api/learning/start',
        { chu_de_id: topic.id, tong_so_tu: 50 },
        token,
        201
      );
      const quiz = await api(
        'POST',
        '/api/quiz/start',
        { chu_de_id: topic.id, tong_so_tu: 50 },
        token,
        201
      );
      assert.equal(legacy.danh_sach_tu.length, 7);
      const target = words.find((word) => word.id === quiz.cau_hoi.tu_vung_id);
      const targetRoute = '/api/admin/words/' + target.id;
      const setStatus = (trang_thai) => api('PUT', targetRoute, { trang_thai }, admin.accessToken);
      const result = (word) =>
        api(
          'POST',
          '/api/learning/result',
          {
            phien_hoc_tap_id: legacy.phien_hoc_tap_id,
            tu_vung_id: word.id,
            trang_thai: word.id === target.id ? 'chua-nho' : 'da-nho',
          },
          token
        );

      await api('PUT', '/api/favorites/' + target.id, undefined, token);
      await result(target);
      await api('PUT', targetRoute, { trang_thai: 'inactive' }, token, 403);
      await api('PUT', targetRoute, { trang_thai: 'locked' }, admin.accessToken, 400);
      await api('GET', '/api/admin/words?status=locked', undefined, admin.accessToken, 400);
      await setStatus('inactive');
      await setStatus('inactive');
      const edited = await api('PUT', targetRoute, { phien_am: '/test/' }, admin.accessToken);
      assert.equal(edited.trang_thai, 'inactive');
      assert.equal(edited.vi_du.length, 1);
      assert.equal(
        (await api('GET', '/api/words/' + target.id, undefined, admin.accessToken)).trang_thai,
        'inactive'
      );
      await api('GET', '/api/words/' + target.id, undefined, token, 404);
      await api('GET', '/api/words/' + target.id, undefined, undefined, 404);

      const publicWords = await api(
        'GET',
        '/api/words?topicId=' + topic.id + '&status=inactive',
        undefined,
        token
      );
      assert.equal(publicWords.length, 6);
      const search = await api('GET', '/api/words?search=Visibility&status=inactive');
      assert.equal(search.pagination.total, 6);
      assert.ok(search.items.every((word) => word.trang_thai === 'active'));
      const hidden = await api(
        'GET',
        '/api/admin/words?topicId=' + topic.id + '&status=inactive&limit=1',
        undefined,
        admin.accessToken
      );
      assert.equal(hidden.pagination.total, 2);
      assert.equal(hidden.items.length, 1);
      const active = await api(
        'GET',
        '/api/admin/words?topicId=' + topic.id + '&status=active',
        undefined,
        admin.accessToken
      );
      assert.equal(active.pagination.total, 6);
      const all = await api(
        'GET',
        '/api/admin/words?topicId=' + topic.id,
        undefined,
        admin.accessToken
      );
      assert.equal(all.pagination.total, 8);
      assert.equal((await api('GET', '/api/topics/' + topic.id)).word_count, 6);
      const adminTopic = (await api('GET', '/api/admin/topics', undefined, admin.accessToken)).find(
        (item) => item.id === topic.id
      );
      assert.equal(adminTopic.word_count, 8);
      assert.equal(adminTopic.active_word_count, 6);
      assert.equal(
        (await api('GET', '/api/progress/topics?topicId=' + topic.id, undefined, token))[0]
          .total_words,
        6
      );

      assert.equal((await api('GET', '/api/favorites', undefined, token)).length, 0);
      await api('PUT', '/api/favorites/' + target.id, undefined, token, 404);
      const [[favorite]] = await connection.execute(
        'SELECT COUNT(*) AS count FROM yeu_thich WHERE nguoi_dung_id = ? AND tu_vung_id = ?',
        [user.id, target.id]
      );
      assert.equal(favorite.count, 1);
      assert.equal((await api('GET', '/api/learning/review', undefined, token)).so_tu_can_on, 0);
      assert.equal((await api('GET', '/api/home/dashboard', undefined, token)).so_tu_can_on, 0);
      await api('POST', '/api/learning/review/start', {}, token, 404);
      await api('POST', '/api/quiz/review/start', {}, token, 404);

      const fresh = await api(
        'POST',
        '/api/learning/start',
        { chu_de_id: topic.id, tong_so_tu: 50 },
        token,
        201
      );
      assert.equal(fresh.danh_sach_tu.length, 6);
      assert.ok(
        fresh.danh_sach_tu.every((word) => word.id !== target.id && word.id !== words[7].id)
      );
      const freshQuiz = await api(
        'POST',
        '/api/quiz/start',
        { chu_de_id: topic.id, tong_so_tu: 50 },
        token,
        201
      );
      const [snapshots] = await connection.execute(
        'SELECT tu_vung_id, noi_dung_trac_nghiem FROM phien_hoc_tu WHERE phien_hoc_tap_id = ?',
        [freshQuiz.phien_hoc_tap_id]
      );
      assert.equal(snapshots.length, 6);
      for (const member of snapshots) {
        assert.notEqual(member.tu_vung_id, target.id);
        const snapshot =
          typeof member.noi_dung_trac_nghiem === 'string'
            ? JSON.parse(member.noi_dung_trac_nghiem)
            : member.noi_dung_trac_nghiem;
        assert.ok(!snapshot.lua_chon.includes(target.nghia_tieng_viet));
        assert.ok(!snapshot.lua_chon.includes(words[7].nghia_tieng_viet));
      }

      // Từ đã ẩn vẫn có trong phiên đang học và kết quả cũ.
      assert.deepEqual(
        await api('GET', '/api/quiz/' + quiz.phien_hoc_tap_id, undefined, token),
        quiz
      );
      const [[question]] = await connection.execute(
        'SELECT dap_an_dung_id FROM cau_hoi_trac_nghiem WHERE id = ?',
        [quiz.cau_hoi.id]
      );
      await api(
        'POST',
        '/api/quiz/' + quiz.phien_hoc_tap_id + '/answers',
        {
          cau_hoi_id: quiz.cau_hoi.id,
          lua_chon_id: question.dap_an_dung_id,
          ma_yeu_cau: randomUUID(),
        },
        token
      );
      for (const word of legacy.danh_sach_tu) {
        await result(word);
      }
      await api(
        'POST',
        '/api/learning/complete',
        { phien_hoc_tap_id: legacy.phien_hoc_tap_id },
        token
      );
      const history = await api('GET', '/api/history/' + legacy.phien_hoc_tap_id, undefined, token);
      assert.equal(history.results.length, 7);
      assert.ok(history.results.some((item) => item.tu_vung_id === target.id));
      const progress = await api('GET', '/api/progress', undefined, token);
      assert.equal(progress.tong_so_tu_da_hoc, 7);
      assert.equal(
        progress.theo_chu_de.find((item) => item.topic_id === topic.id).learned_words,
        6
      );
      await api('DELETE', targetRoute, undefined, admin.accessToken, 409);

      await setStatus('active');
      await setStatus('active');
      assert.equal((await api('GET', '/api/favorites', undefined, token))[0].id, target.id);
      assert.equal((await api('GET', '/api/learning/review', undefined, token)).so_tu_can_on, 1);
      const review = await api('POST', '/api/learning/review/start', {}, token, 201);
      assert.equal(review.danh_sach_tu[0].id, target.id);
      const reviewQuiz = await api('POST', '/api/quiz/review/start', {}, token, 201);
      assert.equal(reviewQuiz.cau_hoi.tu_vung_id, target.id);

      // Trạng thái từ không thể vượt qua trạng thái ẩn của chủ đề.
      await api(
        'PUT',
        '/api/admin/topics/' + topic.id,
        { trang_thai: 'inactive' },
        admin.accessToken
      );
      await api('GET', '/api/words/' + target.id, undefined, token, 404);
      await api(
        'PUT',
        '/api/admin/topics/' + topic.id,
        { trang_thai: 'active' },
        admin.accessToken
      );
      await setStatus('inactive');
      const another = words.find((word) => word.id !== target.id && word.trang_thai === 'active');
      const third = words.find(
        (word) => word.id !== target.id && word.id !== another.id && word.trang_thai === 'active'
      );
      for (const word of [another, third]) {
        await api(
          'PUT',
          '/api/admin/words/' + word.id,
          { trang_thai: 'inactive' },
          admin.accessToken
        );
      }
      await api('POST', '/api/learning/start', { chu_de_id: topic.id, tong_so_tu: 5 }, token, 409);
      await api('POST', '/api/quiz/start', { chu_de_id: topic.id, tong_so_tu: 5 }, token, 409);
      await api('DELETE', '/api/favorites/' + target.id, undefined, token);
      await setStatus('active');
      assert.equal((await api('GET', '/api/favorites', undefined, token)).length, 0);
    }
  );
}

module.exports = { verifyUpgrade, verifyBehavior };
