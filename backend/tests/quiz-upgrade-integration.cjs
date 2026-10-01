const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const quizAnswer = require('./quiz-answer.cjs');

module.exports = async function quizUpgrade(t, { api, connection, admin }) {
  async function account(email) {
    const credentials = { email, mat_khau: 'Test123456' };
    await api(
      'POST',
      '/api/auth/register',
      { ...credentials, ho_ten: 'Kiểm thử nâng cấp' },
      undefined,
      201
    );
    return api('POST', '/api/auth/login', credentials);
  }
  const learner = await account('upgrade-learner@test.local');
  const other = await account('upgrade-other@test.local');
  await t.test(
    'both legacy quiz versions resume partial results without skipping words',
    async () => {
      const createLegacy = require('./legacy-session.cjs')(connection);
      const topic = await api(
        'POST',
        '/api/admin/topics',
        { ten: 'Legacy quiz upgrade' },
        admin.accessToken,
        201
      );
      for (let i = 0; i < 5; i++) {
        await api(
          'POST',
          '/api/admin/words',
          {
            chu_de_id: topic.id,
            tu_tieng_anh: 'Upgrade ' + i,
            nghia_tieng_viet: 'Nâng cấp ' + i,
            loai_tu: 'danh-tu',
          },
          admin.accessToken,
          201
        );
      }
      for (const version of ['adaptive-v1', 'leitner-adaptive-v1']) {
        const start = await createLegacy(
          'POST',
          '/api/quiz/start',
          { chu_de_id: topic.id, tong_so_tu: 5 },
          learner.accessToken
        );
        const id = start.phien_hoc_tap_id;
        await connection.execute('UPDATE phien_hoc_tap SET phien_ban_thuat_toan = ? WHERE id = ?', [
          version,
          id,
        ]);
        let state = await api('GET', '/api/quiz/' + id, undefined, learner.accessToken);
        await api('GET', '/api/quiz/' + id, undefined, other.accessToken, 404);
        for (let turn = 0; state.cau_hoi && turn < 20; turn++) {
          const response = await api(
            'POST',
            '/api/quiz/' + id + '/answers',
            {
              cau_hoi_id: state.cau_hoi.id,
              ...(await quizAnswer(connection, state.cau_hoi.id)),
              ma_yeu_cau: randomUUID(),
            },
            learner.accessToken
          );
          state = response.phien;
          if (turn === 0) {
            assert.equal(state.so_tu_hoan_thanh, 0);
          }
          // Khôi phục giữa phiên phải giữ đúng câu và chưa coi một lần đúng là đã xong.
          if (turn === 4) {
            const restored = await api('GET', '/api/quiz/' + id, undefined, learner.accessToken);
            assert.deepEqual(restored, state);
            assert.equal(restored.so_tu_hoan_thanh, 0);
          }
        }
        assert.equal(state.trang_thai, 'hoan-thanh');
        assert.equal(state.so_luot_tra_loi, 10);
        const [[results]] = await connection.execute(
          'SELECT COUNT(*) AS total FROM ket_qua_hoc WHERE phien_hoc_tap_id = ?',
          [id]
        );
        assert.equal(results.total, 5);
      }
    }
  );

  await t.test(
    'history pagination includes old sessions and stopping releases reserved due words',
    async () => {
      const topic = await api(
        'POST',
        '/api/admin/topics',
        { ten: 'History recovery' },
        admin.accessToken,
        201
      );
      const word = await api(
        'POST',
        '/api/admin/words',
        {
          chu_de_id: topic.id,
          tu_tieng_anh: 'Restore',
          nghia_tieng_viet: 'Khôi phục',
          loai_tu: 'dong-tu',
        },
        admin.accessToken,
        201
      );
      await connection.execute(
        'INSERT INTO tien_do_tu_vung (nguoi_dung_id, tu_vung_id, da_hoc, ngay_on_tap_tiep_theo) VALUES (?, ?, TRUE, NOW())',
        [other.user.id, word.id]
      );
      const quiz = await api(
        'POST',
        '/api/quiz/start',
        { chu_de_id: topic.id, tong_so_tu: 1 },
        other.accessToken,
        201
      );
      await api(
        'POST',
        '/api/quiz/start',
        { chu_de_id: topic.id, tong_so_tu: 1 },
        other.accessToken,
        404
      );
      await api(
        'POST',
        '/api/quiz/' + quiz.phien_hoc_tap_id + '/stop',
        {},
        learner.accessToken,
        404
      );
      await api('POST', '/api/quiz/' + quiz.phien_hoc_tap_id + '/stop', {}, other.accessToken);
      const reopened = await api(
        'POST',
        '/api/quiz/start',
        { chu_de_id: topic.id, tong_so_tu: 1 },
        other.accessToken,
        201
      );
      assert.notEqual(reopened.phien_hoc_tap_id, quiz.phien_hoc_tap_id);
      assert.equal(reopened.cau_hoi.tu_vung_id, word.id);
      // Sắp xếp ổn định ngay cả khi nhiều phiên được tạo trong cùng một giây.
      const ids = Array.from({ length: 51 }, () => randomUUID());
      for (const id of ids) {
        await connection.execute(
          "INSERT INTO phien_hoc_tap (id, nguoi_dung_id, chu_de_id, tong_so_tu, phuong_thuc) VALUES (?, ?, ?, 1, 'flashcard')",
          [id, other.user.id, topic.id]
        );
      }
      const found = [];
      let page = 1;
      let pages;
      do {
        const response = await api(
          'GET',
          '/api/history?page=' + page + '&limit=20',
          undefined,
          other.accessToken
        );
        found.push(...response.items.map((item) => item.id));
        pages = response.pagination.totalPages;
        page++;
      } while (page <= pages);
      assert.equal(new Set(found).size, found.length);
      assert.ok(ids.every((id) => found.includes(id)));
    }
  );
};
