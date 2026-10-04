const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const quizAnswer = require('./quiz-answer.cjs');

module.exports = async function reportBusiness(t, { api, connection, admin }) {
  await t.test(
    'report: flashcards, due-only Leitner queue, progress, badges and admin guards',
    async () => {
      const credentials = { email: 'report@test.local', mat_khau: 'Test123456' };
      await api(
        'POST',
        '/api/auth/register',
        { ...credentials, ho_ten: 'Báo cáo' },
        undefined,
        201
      );
      const learner = await api('POST', '/api/auth/login', credentials);
      const token = learner.accessToken;
      const uid = learner.user.id;
      await api('PUT', '/api/auth/profile', { muc_tieu_hang_ngay: 5 }, token);
      const topic = await api(
        'POST',
        '/api/admin/topics',
        { ten: 'Học theo báo cáo' },
        admin.accessToken,
        201
      );
      await api('POST', '/api/admin/topics', { ten: topic.ten }, admin.accessToken, 409);
      const allWords = [];
      for (let i = 0; i < 6; i++) {
        allWords.push(
          await api(
            'POST',
            '/api/admin/words',
            {
              chu_de_id: topic.id,
              tu_tieng_anh: 'Report ' + i,
              nghia_tieng_viet: 'Báo cáo ' + i,
              loai_tu: 'danh-tu',
              thu_tu_hien_thi: i,
              url_hinh_anh: '/uploads/old-image.png',
              vi_du: [{ cau_tieng_anh: 'An example.', cau_tieng_viet: 'Một ví dụ.' }],
            },
            admin.accessToken,
            201
          )
        );
      }
      await api(
        'POST',
        '/api/admin/words',
        {
          chu_de_id: topic.id,
          tu_tieng_anh: 'report 0',
          nghia_tieng_viet: 'Trùng',
          loai_tu: 'danh-tu',
        },
        admin.accessToken,
        409
      );
      const edited = await api(
        'PUT',
        '/api/admin/words/' + allWords[0].id,
        { phien_am: '/test/' },
        admin.accessToken
      );
      assert.equal(edited.url_hinh_anh, '/uploads/old-image.png');
      assert.equal(edited.vi_du.length, 1);
      const badgeBody = {
        tieu_de: 'Hai từ ngăn năm',
        mo_ta: 'Đạt hai từ ở ngăn 5',
        bieu_tuong: 'star',
        diem_thuong: 10,
        loai: 'mastered_words',
        moc: 2,
      };
      const badge = await api('POST', '/api/admin/achievements', badgeBody, admin.accessToken, 201);
      await api('POST', '/api/admin/achievements', badgeBody, admin.accessToken, 409);
      await api('POST', '/api/learning/flashcards/start', { chu_de_id: topic.id }, undefined, 401);
      await api('POST', '/api/learning/start', { chu_de_id: topic.id }, token, 410);
      await api('POST', '/api/quiz/start', { chu_de_id: topic.id }, token, 404);
      await api('POST', '/api/quiz/topic/start', { chu_de_id: topic.id }, token, 404);
      const start = () =>
        api('POST', '/api/learning/flashcards/start', { chu_de_id: topic.id }, token, 201);
      const [flash, duplicate] = await Promise.all([start(), start()]);
      assert.equal(flash.phien_hoc_tap_id, duplicate.phien_hoc_tap_id);
      assert.equal(flash.danh_sach_tu.length, 5);
      assert.equal(new Set(flash.danh_sach_tu.map((word) => word.id)).size, 5);
      assert.equal(flash.danh_sach_tu[0].vi_du.length, 1);
      const id = flash.phien_hoc_tap_id;
      const view = (word, owner = token, status = 200) =>
        api(
          'POST',
          '/api/learning/flashcards/view',
          { phien_hoc_tap_id: id, tu_vung_id: word.id },
          owner,
          status
        );
      const complete = (status = 200) =>
        api('POST', '/api/learning/flashcards/complete', { phien_hoc_tap_id: id }, token, status);
      await complete(409);
      await view(flash.danh_sach_tu[1], token, 409);
      await view(flash.danh_sach_tu[0], admin.accessToken, 404);
      await api(
        'POST',
        '/api/learning/result',
        { phien_hoc_tap_id: id, tu_vung_id: allWords[0].id, trang_thai: 'da-nho' },
        token,
        409
      );
      await Promise.all([view(flash.danh_sach_tu[0]), view(flash.danh_sach_tu[0])]);
      assert.ok((await start()).danh_sach_tu[0].da_xem_luc);
      assert.equal((await api('GET', '/api/progress', undefined, token)).tong_so_tu_da_hoc, 1);
      const topicPractice = await api(
        'POST',
        '/api/quiz/topic/start',
        { chu_de_id: topic.id, tong_so_tu: 1 },
        token,
        201
      );
      assert.equal(topicPractice.tong_so_tu, 1);
      await api('POST', '/api/quiz/' + topicPractice.phien_hoc_tap_id + '/stop', {}, token);

      // Lưu trạng thái xem và tiến độ từ vựng trong cùng một giao dịch.
      const secondWord = flash.danh_sach_tu[1];
      await connection.query(
        "CREATE TRIGGER fail_flash_result BEFORE INSERT ON ket_qua_hoc FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'test flash rollback'"
      );
      try {
        await view(secondWord, token, 500);
      } finally {
        await connection.query('DROP TRIGGER fail_flash_result');
      }
      const [[rolledBackView]] = await connection.execute(
        'SELECT da_xem_luc FROM phien_hoc_tu WHERE phien_hoc_tap_id = ? AND tu_vung_id = ?',
        [id, secondWord.id]
      );
      assert.equal(rolledBackView.da_xem_luc, null);
      assert.equal((await api('GET', '/api/progress', undefined, token)).tong_so_tu_da_hoc, 1);

      for (const word of flash.danh_sach_tu.slice(1)) {
        await view(word);
      }
      const partialProgress = await api('GET', '/api/progress', undefined, token);
      assert.equal(partialProgress.tong_so_tu_da_hoc, 5);
      assert.equal(partialProgress.hom_nay, 5);
      assert.equal(
        (await api('GET', '/api/home/dashboard', undefined, token)).tien_do_hom_nay.da_hoc,
        5
      );
      const completed = await Promise.all([complete(), complete()]);
      assert.deepEqual(completed[0], completed[1]);
      const [progress] = await connection.execute(
        'SELECT * FROM tien_do_tu_vung WHERE nguoi_dung_id = ?',
        [uid]
      );
      assert.equal(progress.length, 5);
      assert.ok(progress.every((word) => word.ngan_leitner === 1 && word.so_lan_on_tap === 0));
      assert.ok(
        progress.every(
          (word) => Math.abs(new Date(word.ngay_on_tap_tiep_theo) - Date.now() - 86400000) < 30000
        )
      );
      assert.equal((await api('GET', '/api/progress', undefined, token)).moi_hoc, 5);
      assert.equal((await api('GET', '/api/progress', undefined, token)).chuoi_ngay_hoc, 1);
      const nextFlash = await start();
      const learnedIds = new Set(flash.danh_sach_tu.map((word) => word.id));
      const remainingWord = allWords.find((word) => !learnedIds.has(word.id));
      assert.equal(nextFlash.danh_sach_tu.length, 1);
      assert.equal(nextFlash.danh_sach_tu[0].id, remainingWord.id);
      await api('POST', '/api/quiz/start', { chu_de_id: topic.id }, token, 404);
      for (const [index, word] of flash.danh_sach_tu.slice(0, 3).entries()) {
        await connection.execute(
          'UPDATE tien_do_tu_vung SET ngan_leitner = ?, ngay_on_tap_tiep_theo = DATE_SUB(NOW(), INTERVAL 1 DAY) WHERE nguoi_dung_id = ? AND tu_vung_id = ?',
          [[4, 5, 4][index], uid, word.id]
        );
      }
      let quiz = await api('POST', '/api/quiz/start', { chu_de_id: topic.id }, token, 201);
      assert.equal(quiz.tong_so_tu, 3);
      await api('POST', '/api/quiz/start', { chu_de_id: topic.id }, token, 404);
      const quizId = quiz.phien_hoc_tap_id;
      const wrongId = quiz.cau_hoi.tu_vung_id;
      const answer = async (wrong = false) => {
        const body = {
          cau_hoi_id: quiz.cau_hoi.id,
          ...(await quizAnswer(connection, quiz.cau_hoi.id, !wrong)),
          ma_yeu_cau: randomUUID(),
        };
        const responses = await Promise.all([
          api('POST', '/api/quiz/' + quizId + '/answers', body, token),
          api('POST', '/api/quiz/' + quizId + '/answers', body, token),
        ]);
        assert.deepEqual(responses[0], responses[1]);
        quiz = responses[0].phien;
      };
      await answer(true);
      const [[reset]] = await connection.execute(
        'SELECT * FROM tien_do_tu_vung WHERE nguoi_dung_id = ? AND tu_vung_id = ?',
        [uid, wrongId]
      );
      assert.equal(reset.ngan_leitner, 1);
      assert.equal(reset.so_lan_on_tap, 1);
      assert.notEqual(quiz.cau_hoi.tu_vung_id, wrongId);
      while (quiz.cau_hoi) {
        await answer();
      }
      assert.equal(quiz.so_luot_tra_loi, 4);
      assert.equal(quiz.so_tu_dung_lan_dau, 2);
      assert.equal(quiz.so_tu_can_luyen_lai, 1);
      const [[stillReset]] = await connection.execute(
        'SELECT * FROM tien_do_tu_vung WHERE nguoi_dung_id = ? AND tu_vung_id = ?',
        [uid, wrongId]
      );
      assert.equal(stillReset.ngan_leitner, 1);
      assert.equal(stillReset.so_lan_on_tap, 1);
      const summary = await api('GET', '/api/progress', undefined, token);
      assert.equal(summary.da_thuoc, 2);
      assert.equal(summary.ty_le, 40);
      assert.equal(summary.hoat_dong_30_ngay.length, 30);
      const [[earned]] = await connection.execute(
        'SELECT COUNT(*) AS count FROM thanh_tich_nguoi_dung WHERE nguoi_dung_id = ? AND thanh_tich_id = ?',
        [uid, badge.id]
      );
      assert.equal(earned.count, 1);
      assert.equal(
        (await api('GET', '/api/words/' + wrongId, undefined, token)).tien_do.ngan_leitner,
        1
      );
      assert.equal((await api('GET', '/api/words/' + wrongId)).tien_do, null);
      // Sai rồi dừng vẫn giữ hình phạt; một từ duy nhất có thể hỏi lại ngay.
      await connection.execute(
        'UPDATE tien_do_tu_vung SET ngay_on_tap_tiep_theo = NOW() WHERE nguoi_dung_id = ? AND tu_vung_id = ?',
        [uid, wrongId]
      );
      const stopped = await api('POST', '/api/quiz/review/start', { tong_so_tu: 1 }, token, 201);
      await api(
        'POST',
        '/api/quiz/' + stopped.phien_hoc_tap_id + '/answers',
        {
          cau_hoi_id: stopped.cau_hoi.id,
          ...(await quizAnswer(connection, stopped.cau_hoi.id, false)),
          ma_yeu_cau: randomUUID(),
        },
        token
      );
      await api('POST', '/api/quiz/' + stopped.phien_hoc_tap_id + '/stop', {}, token);
      const [[afterStop]] = await connection.execute(
        'SELECT ngan_leitner, so_lan_on_tap FROM tien_do_tu_vung WHERE nguoi_dung_id = ? AND tu_vung_id = ?',
        [uid, wrongId]
      );
      assert.equal(afterStop.ngan_leitner, 1);
      assert.equal(afterStop.so_lan_on_tap, 2);
      await api(
        'POST',
        '/api/learning/flashcards/view',
        {
          phien_hoc_tap_id: nextFlash.phien_hoc_tap_id,
          tu_vung_id: nextFlash.danh_sach_tu[0].id,
        },
        token
      );
      await api(
        'POST',
        '/api/learning/flashcards/complete',
        { phien_hoc_tap_id: nextFlash.phien_hoc_tap_id },
        token
      );
      const repeatedFlash = await start();
      assert.equal(repeatedFlash.danh_sach_tu.length, 5);
      assert.equal(new Set(repeatedFlash.danh_sach_tu.map((word) => word.id)).size, 5);
      assert.ok(
        repeatedFlash.danh_sach_tu.every((word) => allWords.some(({ id }) => id === word.id))
      );
      await api('DELETE', '/api/admin/users/' + uid, undefined, token, 403);
      await api('DELETE', '/api/admin/users/' + admin.user.id, undefined, admin.accessToken, 403);
      await api('DELETE', '/api/admin/users/' + uid, undefined, admin.accessToken);
      await api('GET', '/api/auth/me', undefined, token, 401);
      const [[removed]] = await connection.execute(
        'SELECT COUNT(*) AS count FROM phien_hoc_tap WHERE nguoi_dung_id = ?',
        [uid]
      );
      assert.equal(removed.count, 0);
    }
  );
};
