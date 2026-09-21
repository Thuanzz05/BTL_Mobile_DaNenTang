const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');

module.exports = async function verifyAchievements(
  t,
  { api, connection, admin, learner, base, topic, words }
) {
  const token = admin.accessToken;
  const root = '/api/admin/achievements';
  const badge = (title, extra = {}) => ({
    tieu_de: title,
    mo_ta: 'Huy hiệu kiểm thử',
    bieu_tuong: 'medal',
    diem_thuong: 20,
    loai: 'completed_sessions',
    moc: 1,
    ...extra,
  });
  const users = [];
  for (const index of [1, 2]) {
    const credentials = { email: `achievement-${index}@test.local`, mat_khau: 'Test123456' };
    const user = await api(
      'POST',
      '/api/auth/register',
      { ...credentials, ho_ten: 'Người nhận ' + index },
      undefined,
      201
    );
    const auth = await api('POST', '/api/auth/login', credentials);
    users.push({ id: user.id, token: auth.accessToken });
    await connection.query(
      "INSERT INTO phien_hoc_tap (id, nguoi_dung_id, chu_de_id, tong_so_tu, trang_thai, ket_thuc_luc) VALUES (?, ?, ?, 1, 'hoan-thanh', UTC_TIMESTAMP())",
      [randomUUID(), user.id, topic.id]
    );
  }
  let awarded;
  let dormant;

  await t.test(
    'achievement admin validates CRUD, permissions, filters and pagination',
    async () => {
      await api('GET', root, undefined, undefined, 401);
      await api('GET', root, undefined, learner.accessToken, 403);
      await api('POST', root, badge('Forbidden'), learner.accessToken, 403);
      for (const invalid of [
        { moc: 0 },
        { moc: 1.5 },
        { loai: 'unknown' },
        { diem_thuong: -1 },
        { bieu_tuong: 'bad' },
        { tieu_de: ' ' },
        { unexpected: true },
      ]) {
        await api('POST', root, badge('Invalid', invalid), token, 400);
      }
      for (const filter of [
        'type=unknown',
        'status=locked',
        'page=0',
        'limit=101',
        'search[x]=value',
      ]) {
        await api('GET', root + '?' + filter, undefined, token, 400);
      }
      const created = await api(
        'POST',
        root,
        badge('CRUD draft', { moc: 999, trang_thai: 'inactive' }),
        token,
        201
      );
      const edited = await api(
        'PUT',
        root + '/' + created.id,
        {
          tieu_de: 'CRUD edited',
          loai: 'learned_words',
          moc: 42,
          diem_thuong: 5,
          bieu_tuong: 'book',
        },
        token
      );
      assert.equal(edited.moc, 42);
      assert.equal(edited.loai, 'learned_words');
      await api('PUT', root + '/' + created.id, {}, token, 400);
      await api('PUT', root + '/' + created.id, { moc: 2 }, learner.accessToken, 403);
      await api('DELETE', root + '/' + created.id, undefined, learner.accessToken, 403);
      await api(
        'GET',
        root + '/' + created.id + '/recipients',
        undefined,
        learner.accessToken,
        403
      );
      const results = await api(
        'GET',
        root + '?search=CRUD&type=learned_words&status=inactive&limit=1',
        undefined,
        token
      );
      assert.equal(results.pagination.total, 1);
      assert.equal(results.items[0].id, created.id);
      const next = await api('GET', root + '?search=CRUD&page=2&limit=1', undefined, token);
      assert.equal(next.items.length, 0);
      await api('DELETE', root + '/' + created.id, undefined, token);
      await api('DELETE', root + '/' + created.id, undefined, token, 404);
      await api('PUT', root + '/' + created.id, { moc: 2 }, token, 404);
      await api('GET', root + '/' + created.id + '/recipients', undefined, token, 404);
    }
  );

  await t.test(
    'inactive achievements stop new awards and preserve earned badges, dates and points',
    async () => {
      awarded = await api('POST', root, badge('Earned badge'), token, 201);
      dormant = await api(
        'POST',
        root,
        badge('Disabled badge', { trang_thai: 'inactive' }),
        token,
        201
      );
      const first = await api('GET', '/api/achievements', undefined, users[0].token);
      assert.equal(first.danh_sach.find((item) => item.id === awarded.id).da_mo_khoa, true);
      assert.equal(
        first.danh_sach.some((item) => item.id === dormant.id),
        false
      );
      const before = first.danh_sach.find((item) => item.id === awarded.id);
      await api('PUT', root + '/' + awarded.id, { trang_thai: 'inactive' }, token);
      await require('../migrations/008-achievement-admin')(connection);
      const retained = await api('GET', '/api/achievements', undefined, users[0].token);
      assert.deepEqual(
        retained.danh_sach.find((item) => item.id === awarded.id),
        { ...before, trang_thai: 'inactive' }
      );
      assert.equal(retained.tong_diem, first.tong_diem);
      const hidden = await api('GET', '/api/achievements', undefined, users[1].token);
      assert.equal(
        hidden.danh_sach.some((item) => item.id === awarded.id),
        false
      );
      for (const edit of [{ moc: 2 }, { loai: 'learned_words' }, { diem_thuong: 99 }]) {
        await api('PUT', root + '/' + awarded.id, edit, token, 409);
      }
      await api(
        'PUT',
        root + '/' + awarded.id,
        {
          tieu_de: 'Renamed earned badge',
          mo_ta: 'Mô tả mới',
          bieu_tuong: 'star',
          moc: 1,
          diem_thuong: 20,
        },
        token
      );
      await api('DELETE', root + '/' + awarded.id, undefined, token, 409);
      await api('PUT', root + '/' + awarded.id, { trang_thai: 'active' }, token);
      await Promise.all(
        [1, 2, 3].map(() => api('GET', '/api/achievements', undefined, users[1].token))
      );
      const recipients = await api(
        'GET',
        root + '/' + awarded.id + '/recipients?limit=1',
        undefined,
        token
      );
      assert.equal(recipients.achievement.so_nguoi_dat, 2);
      assert.equal(recipients.pagination.total, 2);
      assert.equal(recipients.items.length, 1);
      assert.deepEqual(Object.keys(recipients.items[0]).sort(), [
        'email',
        'ho_ten',
        'id',
        'ngay_mo_khoa',
      ]);
      const second = await api(
        'GET',
        root + '/' + awarded.id + '/recipients?page=2&limit=1',
        undefined,
        token
      );
      assert.notEqual(second.items[0].id, recipients.items[0].id);
      const filtered = await api(
        'GET',
        root + '/' + awarded.id + '/recipients?search=achievement-1',
        undefined,
        token
      );
      assert.equal(filtered.pagination.total, 1);
      assert.equal(filtered.items[0].id, users[0].id);
      assert.equal(filtered.achievement.so_nguoi_dat, 2);
      const [[row]] = await connection.query(
        'SELECT COUNT(*) AS count FROM thanh_tich_nguoi_dung WHERE thanh_tich_id = ?',
        [awarded.id]
      );
      assert.equal(row.count, 2);
    }
  );

  await t.test(
    'admin rules for learned words and streaks award only after reaching the target',
    async () => {
      const wordBadge = await api(
        'POST',
        root,
        badge('Word milestone', { loai: 'learned_words', moc: 1 }),
        token,
        201
      );
      const streakBadge = await api(
        'POST',
        root,
        badge('Streak milestone', { loai: 'streak', moc: 2 }),
        token,
        201
      );
      const before = await api('GET', '/api/achievements', undefined, users[0].token);
      assert.equal(before.danh_sach.find((item) => item.id === wordBadge.id).da_mo_khoa, false);
      assert.equal(before.danh_sach.find((item) => item.id === streakBadge.id).da_mo_khoa, false);
      await connection.query(
        'INSERT INTO tien_do_tu_vung (nguoi_dung_id, tu_vung_id, da_hoc) VALUES (?, ?, TRUE)',
        [users[0].id, words[0].id]
      );
      await connection.query(
        "INSERT INTO phien_hoc_tap (id, nguoi_dung_id, chu_de_id, tong_so_tu, trang_thai, bat_dau_luc, ket_thuc_luc) VALUES (?, ?, ?, 1, 'hoan-thanh', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 DAY), DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 DAY))",
        [randomUUID(), users[0].id, topic.id]
      );
      const after = await api('GET', '/api/achievements', undefined, users[0].token);
      assert.equal(after.danh_sach.find((item) => item.id === wordBadge.id).da_mo_khoa, true);
      assert.equal(after.danh_sach.find((item) => item.id === streakBadge.id).da_mo_khoa, true);
    }
  );

  await t.test('award and deletion races never delete a granted achievement', async () => {
    const racing = await api('POST', root, badge('Concurrent badge'), token, 201);
    const [, deletion] = await Promise.all([
      api('GET', '/api/achievements', undefined, users[0].token),
      fetch(base + root + '/' + racing.id, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token },
        signal: AbortSignal.timeout(10000),
      }),
    ]);
    assert.ok([200, 409].includes(deletion.status));
    const [[remaining]] = await connection.query(
      'SELECT COUNT(*) AS count FROM thanh_tich WHERE id = ?',
      [racing.id]
    );
    const [[earned]] = await connection.query(
      'SELECT COUNT(*) AS count FROM thanh_tich_nguoi_dung WHERE thanh_tich_id = ?',
      [racing.id]
    );
    if (deletion.status === 409) {
      assert.equal(remaining.count, 1);
      assert.equal(earned.count, 1);
    } else {
      assert.equal(remaining.count, 0);
      assert.equal(earned.count, 0);
    }
  });
};
