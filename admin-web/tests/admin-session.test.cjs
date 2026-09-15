const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const filename = path.resolve(__dirname, '../src/services/admin-session.ts');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});
const loaded = new Module(filename, module);
loaded._compile(compiled.outputText, filename);
const { AdminSession, ApiError } = loaded.exports;
const auth = (token = 'access') => ({ user: { id: 'admin', ho_ten: 'Admin', email: 'admin@test.local', vai_tro: 'admin' }, accessToken: token });

test('admin login normalizes credentials and keeps access token only in memory', async () => {
  const calls = [];
  const session = new AdminSession(async (url, options) => { calls.push({ url, options }); return auth(); });
  await session.login(' ADMIN@Test.Local ', 'Test123456');
  assert.equal(session.getSnapshot().user.vai_tro, 'admin');
  assert.deepEqual(JSON.parse(calls[0].options.body), { email: 'admin@test.local', mat_khau: 'Test123456' });
});

test('concurrent 401 responses share refresh and retry with the new access token', async () => {
  let refreshes = 0;
  const session = new AdminSession(async (url, options) => {
    if (url === '/web-auth/login') { return auth('old'); }
    if (url === '/web-auth/refresh') {
      refreshes += 1;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return auth('new');
    }
    if (options.headers.get('Authorization') === 'Bearer old') { throw new ApiError('Expired', 401); }
    return { success: true };
  });
  await session.login('a@b.c', 'Test123456');
  assert.deepEqual(await Promise.all([session.request('/data'), session.request('/data')]), [{ success: true }, { success: true }]);
  assert.equal(refreshes, 1);
});

test('ordinary forbidden action and network failure preserve the current session', async () => {
  const session = new AdminSession(async (url) => {
    if (url === '/web-auth/login') { return auth(); }
    if (url === '/web-auth/refresh') { throw new ApiError('Offline', 0); }
    throw new ApiError('Not allowed', 403, 'ADMIN_PROTECTED');
  });
  await session.login('a@b.c', 'Test123456');
  await assert.rejects(session.request('/protected'));
  assert.ok(session.getSnapshot());
  await assert.rejects(session.restore());
  assert.ok(session.getSnapshot());
});

test('late refresh cannot restore a session after logout', async () => {
  let resolve;
  const session = new AdminSession(async (url) => {
    if (url === '/web-auth/login') { return auth(); }
    if (url === '/web-auth/refresh') { return new Promise((done) => { resolve = done; }); }
    return {};
  });
  await session.login('a@b.c', 'Test123456');
  const pending = session.restore();
  const rejected = assert.rejects(pending);
  await session.logout();
  resolve(auth('late'));
  await rejected;
  assert.equal(session.getSnapshot(), null);
});

test('learner role and revoked cookies cannot restore admin access', async () => {
  const learner = new AdminSession(async () => ({ ...auth(), user: { ...auth().user, vai_tro: 'user' } }));
  await assert.rejects(learner.login('a@b.c', 'Test123456'));
  assert.equal(learner.getSnapshot(), null);
  const revoked = new AdminSession(async () => { throw new ApiError('Revoked', 401); });
  await assert.rejects(revoked.restore());
  assert.equal(revoked.getSnapshot(), null);
});

test('late profile update cannot resurrect a logged-out session', async () => {
  let resolve;
  const session = new AdminSession(async (url) => {
    if (url === '/web-auth/login') { return auth(); }
    if (url === '/auth/profile') { return new Promise((done) => { resolve = done; }); }
    return {};
  });
  await session.login('a@b.c', 'Test123456');
  const pending = session.updateProfile('New name');
  await session.logout();
  resolve({ ...auth().user, ho_ten: 'New name' });
  await pending;
  assert.equal(session.getSnapshot(), null);
});

test('failed logout keeps the session visible until the server can revoke the cookie', async () => {
  const session = new AdminSession(async (url) => {
    if (url === '/web-auth/login') {
      return auth();
    }
    throw new ApiError('Offline', 0);
  });
  await session.login('a@b.c', 'Test123456');
  await assert.rejects(session.logout(), /Offline/);
  assert.ok(session.getSnapshot());
});
