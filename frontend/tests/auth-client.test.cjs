/* global __dirname */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const output = ts.transpileModule(
  fs.readFileSync(path.join(__dirname, "../services/auth-client.ts"), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const mod = { exports: {} };
vm.runInNewContext(output, { exports: mod.exports, module: mod });
const { AuthClient } = mod.exports;
const user = {
  id: "test",
  ho_ten: "Test User",
  email: "test@example.com",
  vai_tro: "user",
};
const session = { user, accessToken: "access-old", refreshToken: "refresh" };
const failure = (status) =>
  Object.assign(new Error("Request failed"), { status });
function setup(request, initial = null) {
  let token = initial,
    current = null;
  const storage = {
    read: async () => token,
    write: async (value) => {
      token = value;
    },
    clear: async () => {
      token = null;
    },
  };
  return {
    client: new AuthClient(request, storage, (value) => {
      current = value;
    }),
    token: () => token,
    user: () => current,
  };
}
test("registration normalizes Vietnamese contract fields and does not create a session", async () => {
  let body;
  const state = setup(async (path, options) => {
    assert.equal(path, "/auth/register");
    body = JSON.parse(options.body);
    return user;
  });
  await state.client.register(
    "  Test User ",
    " TEST@example.com ",
    "secret123",
  );
  assert.deepEqual(body, {
    ho_ten: "Test User",
    email: "test@example.com",
    mat_khau: "secret123",
  });
  assert.equal(state.token(), null);
});
test("login stores refresh token, sends bearer token, logout clears local session", async () => {
  const state = setup(async (path, options) => {
    if (path === "/auth/login") return session;
    assert.equal(options.headers.Authorization, "Bearer access-old");
    return user;
  });
  await state.client.login("TEST@example.com", "secret123");
  assert.equal(state.token(), "refresh");
  assert.equal(state.user().id, "test");
  await state.client.authorized("/auth/me");
  await state.client.logout();
  assert.equal(state.token(), null);
  assert.equal(state.user(), null);
});
test("concurrent expired requests share a single refresh and retry", async () => {
  let refreshes = 0;
  const state = setup(async (path, options) => {
    if (path === "/auth/login") return session;
    if (path === "/auth/refresh") {
      refreshes++;
      await new Promise((r) => setTimeout(r, 15));
      return { accessToken: "access-new" };
    }
    if (options.headers.Authorization === "Bearer access-old")
      throw failure(401);
    return "ok";
  });
  await state.client.login("test@example.com", "secret123");
  assert.deepEqual(
    await Promise.all([
      state.client.authorized("/one"),
      state.client.authorized("/two"),
    ]),
    ["ok", "ok"],
  );
  assert.equal(refreshes, 1);
});
test("restore preserves saved token during network outage, clears revoked token", async () => {
  const offline = setup(async () => {
    throw failure(0);
  }, "saved");
  await assert.rejects(offline.client.restore());
  assert.equal(offline.token(), "saved");
  const revoked = setup(async () => {
    throw failure(401);
  }, "saved");
  await revoked.client.restore();
  assert.equal(revoked.token(), null);
});
test("restoration loads current server profile", async () => {
  const state = setup(
    async (path) => (path === "/auth/refresh" ? { accessToken: "new" } : user),
    "saved",
  );
  await state.client.restore();
  assert.equal(state.user().ho_ten, "Test User");
});
test("failed logout still clears local credentials", async () => {
  const state = setup(async (path) => {
    if (path === "/auth/login") return session;
    throw failure(0);
  });
  await state.client.login("test@example.com", "secret123");
  await assert.rejects(state.client.logout());
  assert.equal(state.token(), null);
  assert.equal(state.user(), null);
});
test("invalid credentials do not establish a session", async () => {
  const state = setup(async () => {
    throw failure(401);
  });
  await assert.rejects(state.client.login("test@example.com", "wrong"));
  assert.equal(state.user(), null);
  assert.equal(state.token(), null);
});
test("late refresh cannot restore a session after logout", async () => {
  let release;
  const state = setup(async (path, options) => {
    if (path === "/auth/login") return session;
    if (path === "/auth/logout") return null;
    if (path === "/auth/refresh")
      return new Promise((r) => {
        release = r;
      });
    if (options.headers.Authorization === "Bearer access-old")
      throw failure(401);
    return user;
  });
  await state.client.login("test@example.com", "secret123");
  const pending = state.client.authorized("/auth/me");
  await new Promise((r) => setImmediate(r));
  await state.client.logout();
  release({ accessToken: "late" });
  await assert.rejects(pending);
  assert.equal(state.user(), null);
  assert.equal(state.token(), null);
});
test("profile update refreshes local user and password change clears the session", async () => {
  const state = setup(async (path, options) => {
    if (path === "/auth/login") return session;
    if (path === "/auth/profile") {
      assert.equal(options.method, "PUT");
      const body = JSON.parse(options.body);
      if (body.ho_ten) {
        assert.equal(body.ho_ten, "New Name");
        return { ...user, ho_ten: "New Name" };
      }
      assert.equal(body.muc_tieu_hang_ngay, 5);
      return { ...user, ho_ten: "New Name", muc_tieu_hang_ngay: 5 };
    }
    assert.equal(path, "/auth/change-password");
    assert.deepEqual(JSON.parse(options.body), {
      mat_khau_cu: "secret123",
      mat_khau_moi: "newSecret123",
    });
    return { success: true };
  });
  await state.client.login("test@example.com", "secret123");
  await state.client.updateProfile(" New Name ");
  assert.equal(state.user().ho_ten, "New Name");
  await state.client.updateDailyGoal(5);
  assert.equal(state.user().muc_tieu_hang_ngay, 5);
  await state.client.changePassword("secret123", "newSecret123");
  assert.equal(state.user(), null);
  assert.equal(state.token(), null);
});
