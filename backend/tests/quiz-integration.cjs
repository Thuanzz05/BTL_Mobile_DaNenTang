const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');

module.exports = async function quizIntegration(
  t,
  { api, connection, admin, learner, other, base }
) {
  await t.test('web admin cookies, permissions, CSRF and logout', async () => {
    async function web(route, body, cookie, extra = {}) {
      const response = await fetch(base + '/api/web-auth/' + route, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wordleaf-Client': 'admin-web',
          ...(cookie ? { Cookie: cookie } : {}),
          ...extra,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      return { response, json: await response.json() };
    }

    const credentials = { email: 'admin@test.local', mat_khau: 'Test123456' };
    assert.equal(
      (await web('login', credentials, null, { Origin: 'https://untrusted.example' })).response
        .status,
      403
    );
    const denied = await web('login', { ...credentials, email: 'learner@test.local' });
    assert.equal(denied.response.status, 403);
    assert.equal(denied.response.headers.get('set-cookie'), null);

    const login = await web('login', credentials);
    assert.equal(login.response.status, 200);
    assert.equal(login.json.data.refreshToken, undefined);
    const cookie = login.response.headers.get('set-cookie');
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=Strict/i);
    assert.match(cookie, /Path=\/api\/web-auth/i);
    assert.equal(login.response.headers.get('cache-control'), 'no-store');
    const stored = cookie.split(';')[0];
    const restored = await web('refresh', null, stored);
    assert.equal(restored.response.status, 200);
    assert.equal(restored.json.data.user.vai_tro, 'admin');
    assert.equal(
      (await web('refresh', null, stored, { 'X-Wordleaf-Client': '' })).response.status,
      403
    );
    assert.equal((await web('logout', null, stored)).response.status, 200);
    assert.equal((await web('refresh', null, stored)).response.status, 401);
  });

  await t.test(
    'quiz grading, immutable snapshots, rollback, retries, SRS and reports',
    async () => {
      const topic = await api(
        'POST',
        '/api/admin/topics',
        { ten: 'Quiz integration' },
        admin.accessToken,
        201
      );
      for (let index = 0; index < 5; index += 1) {
        await api(
          'POST',
          '/api/admin/words',
          {
            chu_de_id: topic.id,
            tu_tieng_anh: 'Quiz word ' + index,
            nghia_tieng_viet: 'Nghĩa ' + index,
            loai_tu: 'danh-tu',
          },
          admin.accessToken,
          201
        );
      }

      const startBody = { chu_de_id: topic.id, tong_so_tu: 5, ma_yeu_cau: randomUUID() };
      const [start, duplicateStart] = await Promise.all([
        api('POST', '/api/quiz/start', startBody, other.accessToken, 201),
        api('POST', '/api/quiz/start', startBody, other.accessToken, 201),
      ]);
      assert.deepEqual(duplicateStart, start);
      const [[starts]] = await connection.query(
        'SELECT COUNT(*) AS count FROM phien_hoc_tap WHERE nguoi_dung_id = ? AND ma_yeu_cau_khoi_tao = ?',
        [other.user.id, startBody.ma_yeu_cau]
      );
      assert.equal(starts.count, 1);
      await api('POST', '/api/quiz/start', { ...startBody, tong_so_tu: 6 }, other.accessToken, 409);
      await api(
        'POST',
        '/api/quiz/review/start',
        { tong_so_tu: 5, ma_yeu_cau: startBody.ma_yeu_cau },
        other.accessToken,
        409
      );
      const sessionId = start.phien_hoc_tap_id;
      const route = '/api/quiz/' + sessionId;
      assert.equal(start.phien_ban_thuat_toan, 'leitner-adaptive-v1');
      assert.equal(start.cau_hoi.lua_chon.length, 4);
      assert.equal(start.cau_hoi.dap_an_dung_id, undefined);
      assert.equal(start.cau_hoi.nghia_tieng_viet, undefined);
      assert.deepEqual(await api('GET', route, undefined, other.accessToken), start);
      await api('GET', route, undefined, learner.accessToken, 404);
      await api(
        'POST',
        '/api/learning/result',
        {
          phien_hoc_tap_id: sessionId,
          tu_vung_id: start.cau_hoi.tu_vung_id,
          trang_thai: 'da-nho',
        },
        other.accessToken,
        409
      );
      await api(
        'POST',
        '/api/learning/complete',
        { phien_hoc_tap_id: sessionId },
        other.accessToken,
        409
      );

      const [[question]] = await connection.query(
        'SELECT * FROM cau_hoi_trac_nghiem WHERE id = ?',
        [start.cau_hoi.id]
      );
      const answer = {
        cau_hoi_id: question.id,
        lua_chon_id: start.cau_hoi.lua_chon.find((option) => option.id !== question.dap_an_dung_id)
          .id,
        ma_yeu_cau: randomUUID(),
        thoi_gian_tra_loi_ms: 1200,
      };
      await api('POST', route + '/answers', { ...answer, dung: true }, other.accessToken, 400);
      await api(
        'POST',
        route + '/answers',
        { ...answer, lua_chon_id: randomUUID() },
        other.accessToken,
        400
      );
      await api('POST', route + '/answers', answer, learner.accessToken, 404);

      // Lỗi ở bước cuối phải rollback cả đáp án lẫn câu hỏi tiếp theo.
      await connection.query(`CREATE TRIGGER fail_quiz_response BEFORE UPDATE ON cau_hoi_trac_nghiem
      FOR EACH ROW BEGIN IF NEW.phan_hoi IS NOT NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'test rollback'; END IF; END`);
      try {
        await api('POST', route + '/answers', answer, other.accessToken, 500);
        assert.deepEqual(await api('GET', route, undefined, other.accessToken), start);
      } finally {
        await connection.query('DROP TRIGGER fail_quiz_response');
      }

      await api(
        'PUT',
        '/api/admin/words/' + start.cau_hoi.tu_vung_id,
        { nghia_tieng_viet: 'Đã biên tập lại' },
        admin.accessToken
      );
      const [first, replay] = await Promise.all([
        api('POST', route + '/answers', answer, other.accessToken),
        api('POST', route + '/answers', answer, other.accessToken),
      ]);
      assert.deepEqual(first, replay);
      assert.equal(first.ket_qua.dung, false);
      assert.notEqual(first.ket_qua.nghia_tieng_viet, 'Đã biên tập lại');
      assert.equal(first.phien.so_luot_tra_loi, 1);
      await api(
        'POST',
        route + '/answers',
        { ...answer, lua_chon_id: question.dap_an_dung_id },
        other.accessToken,
        409
      );
      await api(
        'POST',
        route + '/answers',
        { ...answer, ma_yeu_cau: randomUUID() },
        other.accessToken,
        409
      );

      let state = first.phien;
      let lastAnswer;
      let lastResponse;
      for (let count = 0; state.cau_hoi && count < 40; count += 1) {
        const [[current]] = await connection.query(
          'SELECT dap_an_dung_id FROM cau_hoi_trac_nghiem WHERE id = ?',
          [state.cau_hoi.id]
        );
        lastAnswer = {
          cau_hoi_id: state.cau_hoi.id,
          lua_chon_id: current.dap_an_dung_id,
          ma_yeu_cau: randomUUID(),
        };
        lastResponse = await api('POST', route + '/answers', lastAnswer, other.accessToken);
        state = lastResponse.phien;
      }

      assert.equal(state.trang_thai, 'hoan-thanh');
      assert.equal(state.so_tu_hoan_thanh, 5);
      assert.equal(state.so_luot_tra_loi, 12);
      assert.equal(state.so_luot_dung, 11);
      assert.deepEqual(
        await api('POST', '/api/quiz/start', startBody, other.accessToken, 201),
        state
      );
      assert.deepEqual(
        await api('POST', route + '/answers', lastAnswer, other.accessToken),
        lastResponse
      );
      assert.deepEqual(await api('GET', route, undefined, other.accessToken), state);
      const [progress] = await connection.query(
        'SELECT * FROM tien_do_tu_vung WHERE nguoi_dung_id = ?',
        [other.user.id]
      );
      assert.equal(progress.length, 5);
      assert.ok(progress.every((word) => word.so_lan_on_tap === 1));
      assert.equal(progress.filter((word) => word.ngan_leitner === 1).length, 1);
      assert.equal(progress.filter((word) => word.ngan_leitner === 2).length, 4);
      const [[activities]] = await connection.query(
        "SELECT COUNT(*) AS count FROM hoat_dong_hoc_tap WHERE nguoi_dung_id = ? AND loai_hoat_dong = 'hoan_thanh_session'",
        [other.user.id]
      );
      assert.equal(activities.count, 1);

      const history = await api('GET', '/api/history/' + sessionId, undefined, other.accessToken);
      assert.equal(history.luot_tra_loi.length, 12);
      assert.equal(history.luot_tra_loi[0].dung, 0);
      const report = await api(
        'GET',
        '/api/admin/quiz-statistics?minAttempts=1',
        undefined,
        admin.accessToken
      );
      assert.equal(report.tong_quan.so_luot, 12);
      assert.equal(report.tong_quan.so_luot_sai, 1);
      assert.equal(report.tu_can_luyen[0].id, start.cau_hoi.tu_vung_id);
      await api('GET', '/api/admin/quiz-statistics', undefined, other.accessToken, 403);
      for (const filters of [
        'from=2026-02-30',
        'from=2026-09-14&to=2026-09-13',
        'from=2020-01-01&to=2026-09-13',
      ]) {
        await api(
          'GET',
          '/api/admin/quiz-statistics?' + filters,
          undefined,
          admin.accessToken,
          400
        );
      }

      const dashboard = await api('GET', '/api/admin/dashboard', undefined, admin.accessToken);
      assert.equal(dashboard.luot_hoc_7_ngay.length, 7);
      assert.equal(dashboard.nguoi_dung_moi_7_ngay.length, 7);
      assert.match(dashboard.luot_hoc_7_ngay[0].ngay, /^\d{4}-\d{2}-\d{2}$/);

      await connection.query(
        'UPDATE tien_do_tu_vung SET ngay_on_tap_tiep_theo = DATE_ADD(NOW(), INTERVAL 2 DAY) WHERE nguoi_dung_id = ?',
        [other.user.id]
      );
      await connection.query(
        'UPDATE tien_do_tu_vung SET ngay_on_tap_tiep_theo = DATE_SUB(NOW(), INTERVAL 1 DAY) WHERE nguoi_dung_id = ? AND tu_vung_id = ?',
        [other.user.id, start.cau_hoi.tu_vung_id]
      );
      const reviewBody = { tong_so_tu: 1, ma_yeu_cau: randomUUID() };
      const review = await api(
        'POST',
        '/api/quiz/review/start',
        reviewBody,
        other.accessToken,
        201
      );
      assert.equal(review.tong_so_tu, 1);
      assert.equal(review.cau_hoi.lua_chon.length, 4);
      await connection.query(
        'UPDATE tien_do_tu_vung SET ngay_on_tap_tiep_theo = DATE_ADD(NOW(), INTERVAL 2 DAY) WHERE nguoi_dung_id = ?',
        [other.user.id]
      );
      assert.deepEqual(
        await api('POST', '/api/quiz/review/start', reviewBody, other.accessToken, 201),
        review
      );
      const stopRoute = '/api/quiz/' + review.phien_hoc_tap_id;
      const stopped = await api('POST', stopRoute + '/stop', {}, other.accessToken);
      assert.equal(stopped.trang_thai, 'bo-do');
      assert.equal(stopped.cau_hoi, null);
      assert.deepEqual(await api('POST', stopRoute + '/stop', {}, other.accessToken), stopped);
      assert.deepEqual(
        await api('POST', '/api/quiz/review/start', reviewBody, other.accessToken, 201),
        stopped
      );
      const anotherUser = await api('POST', '/api/quiz/start', startBody, learner.accessToken, 201);
      assert.notEqual(anotherUser.phien_hoc_tap_id, sessionId);
      await api(
        'PUT',
        '/api/admin/topics/' + topic.id,
        { trang_thai: 'inactive' },
        admin.accessToken
      );
      assert.deepEqual(
        await api('POST', '/api/quiz/start', startBody, learner.accessToken, 201),
        anotherUser
      );
      await api(
        'POST',
        stopRoute + '/answers',
        {
          cau_hoi_id: review.cau_hoi.id,
          lua_chon_id: review.cau_hoi.lua_chon[0].id,
          ma_yeu_cau: randomUUID(),
        },
        other.accessToken,
        409
      );
    }
  );
};
