/* global __dirname */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const { randomUUID } = require("node:crypto");

function load(name, imports = {}) {
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(
      fs.readFileSync(
        path.join(__dirname, "../services/" + name + ".ts"),
        "utf8",
      ),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
        },
      },
    ).outputText,
    {
      exports,
      require: (key) => {
        assert.ok(imports[key], key);
        return imports[key];
      },
    },
  );
  return exports;
}
const { QuizSessionClient } = load("quiz-session", { "./quiz": load("quiz") });
const failure = (code = "OFFLINE") => Object.assign(new Error(code), { code });
const start = {
  kind: "topic",
  topicId: randomUUID(),
  count: 5,
  title: "Đồ ăn",
};
const questionId = randomUUID();
const choiceId = randomUUID();

function setup() {
  const records = new Map();
  let writeFails = false;
  const storage = {
    read: async (key) => records.get(key) ?? null,
    write: async (key, value) => {
      if (writeFails) throw failure("DISK_FULL");
      records.set(key, value);
    },
    remove: async (key) => {
      if (writeFails) throw failure("DISK_FULL");
      records.delete(key);
    },
  };
  const userId = randomUUID();
  const session = {
    phien_hoc_tap_id: randomUUID(),
    trang_thai: "dang-hoc",
    tong_so_tu: 5,
    so_tu_hoan_thanh: 0,
    so_luot_tra_loi: 0,
    so_luot_dung: 0,
    ty_le_dung: null,
    cau_hoi: {
      id: questionId,
      tu_vung_id: randomUUID(),
      lua_chon: [{ id: choiceId }],
    },
  };
  const requests = [];
  const server = {
    session,
    failBefore: "",
    failAfter: "",
    replies: new Map(),
    starts: new Set(),
  };
  async function request(route, options) {
    const body = options?.body ? JSON.parse(options.body) : undefined;
    const action = route.endsWith("start")
      ? "start"
      : route.endsWith("answers")
        ? "answer"
        : route.endsWith("stop")
          ? "stop"
          : "get";
    requests.push({ action, body });
    if (server.failBefore === action) throw failure();
    let result = server.session;
    if (action === "start") {
      const saved = JSON.parse(records.get(`wordleaf.quiz.v1.${userId}`));
      assert.equal(
        saved.start.requestId,
        body.ma_yeu_cau,
        "persist start before sending",
      );
      server.starts.add(body.ma_yeu_cau);
    } else if (action === "answer") {
      const saved = JSON.parse(records.get(`wordleaf.quiz.v1.${userId}`));
      assert.deepEqual(
        saved.pending,
        body,
        "persist full answer before sending",
      );
      if (server.replies.has(body.ma_yeu_cau))
        result = server.replies.get(body.ma_yeu_cau);
      else {
        server.session = {
          ...server.session,
          so_luot_tra_loi: server.session.so_luot_tra_loi + 1,
        };
        result = { ket_qua: { dung: true }, phien: server.session };
        server.replies.set(body.ma_yeu_cau, result);
      }
    } else if (action === "stop") {
      server.session = {
        ...server.session,
        trang_thai: "bo-do",
        cau_hoi: null,
      };
      result = server.session;
    }
    if (server.failAfter === action) throw failure();
    return result;
  }
  return {
    records,
    requests,
    server,
    storage,
    userId,
    request,
    diskFailure: (value) => {
      writeFails = value;
    },
    client: () => new QuizSessionClient(userId, request, storage),
  };
}

test("restart after losing start response reuses the same session and start key", async () => {
  const env = setup();
  env.server.failAfter = "start";
  await assert.rejects(env.client().open(start), /OFFLINE/);
  env.server.failAfter = "";
  const restored = await env.client().open();
  assert.equal(
    restored.session.phien_hoc_tap_id,
    env.server.session.phien_hoc_tap_id,
  );
  assert.equal(env.server.starts.size, 1);
});

test("duplicate mounts share opening; a different topic never overwrites an unfinished session", async () => {
  const env = setup();
  const client = env.client();
  await Promise.all([client.open(start), client.open(start)]);
  assert.equal(env.requests.filter((r) => r.action === "start").length, 1);
  await client.open({ ...start, topicId: randomUUID(), title: "Other" });
  assert.equal(client.getSnapshot().start.title, start.title);
  assert.equal(env.server.starts.size, 1);
});

test("offline answer survives restart and replays the exact payload once", async () => {
  const env = setup();
  const client = env.client();
  await client.open(start);
  env.server.failAfter = "answer";
  await assert.rejects(client.answer(questionId, choiceId), /OFFLINE/);
  const pending = JSON.stringify(client.getSnapshot().pending);
  env.server.failAfter = "";
  // A later device has already advanced: stored replay must not rewind the UI.
  env.server.session = { ...env.server.session, so_luot_tra_loi: 3 };
  const restored = env.client();
  const result = await restored.open();
  assert.equal(result.session.so_luot_tra_loi, 3);
  assert.equal(env.server.replies.size, 1);
  assert.equal(
    JSON.stringify(env.requests.filter((r) => r.action === "answer")[1].body),
    pending,
  );
  assert.equal(restored.getSnapshot().pending, null);
});

test("pending answer cannot be replaced; concurrent submissions cannot count twice", async () => {
  const env = setup();
  const client = env.client();
  await client.open(start);
  env.server.failBefore = "answer";
  const results = await Promise.allSettled([
    client.answer(questionId, choiceId),
    client.answer(questionId, randomUUID()),
  ]);
  assert.ok(results.every((result) => result.status === "rejected"));
  await assert.rejects(client.answer(questionId, randomUUID()), /đang chờ/);
  assert.equal(client.getSnapshot().pending.lua_chon_id, choiceId);
  assert.equal(env.requests.filter((r) => r.action === "answer").length, 1);
});

test("storage failure prevents network submission and retains acknowledged-but-not-cleared answers", async () => {
  const env = setup();
  const client = env.client();
  env.diskFailure(true);
  await assert.rejects(client.open(start), /Chưa lưu/);
  assert.equal(env.requests.length, 0);
  env.diskFailure(false);
  await client.open(start);
  env.diskFailure(true);
  await assert.rejects(client.answer(questionId, choiceId), /Chưa lưu/);
  assert.equal(env.requests.filter((r) => r.action === "answer").length, 0);
  env.diskFailure(false);
  const flaky = new QuizSessionClient(
    env.userId,
    async (route, options) => {
      const result = await env.request(route, options);
      if (route.endsWith("answers")) env.diskFailure(true);
      return result;
    },
    env.storage,
  );
  await flaky.open();
  await assert.rejects(flaky.answer(questionId, choiceId), /Chưa lưu/);
  assert.ok(flaky.getSnapshot().pending);
  env.diskFailure(false);
  await env.client().open();
  assert.equal(env.server.replies.size, 1);
});

test("stop intent survives restart and flushes pending answer before stopping", async () => {
  const env = setup();
  const client = env.client();
  await client.open(start);
  env.server.failBefore = "answer";
  await assert.rejects(client.answer(questionId, choiceId));
  await assert.rejects(client.stop());
  assert.equal(client.getSnapshot().stopping, true);
  assert.equal(env.requests.filter((r) => r.action === "stop").length, 0);
  env.server.failBefore = "";
  const restored = env.client();
  const result = await restored.open();
  assert.equal(result.session.trang_thai, "bo-do");
  assert.equal(env.server.session.so_luot_tra_loi, 1);
  assert.equal(restored.getSnapshot(), null);
  assert.equal(env.records.size, 0);
});

test("lost stop response retries safely; completed sessions are cleared on resume", async () => {
  const env = setup();
  const client = env.client();
  await client.open(start);
  env.server.failAfter = "stop";
  await assert.rejects(client.stop());
  assert.equal(client.getSnapshot().stopping, true);
  env.server.failAfter = "";
  await env.client().open();
  assert.equal(env.records.size, 0);
  env.server.session = { ...env.server.session, trang_thai: "hoan-thanh" };
  await client.open();
  assert.equal(client.getSnapshot(), null);
});

test("drafts are isolated by account, including pending answers", async () => {
  const env = setup();
  const client = env.client();
  await client.open(start);
  env.server.failBefore = "answer";
  await assert.rejects(client.answer(questionId, choiceId));
  const other = new QuizSessionClient(
    randomUUID(),
    async () => {
      throw new Error("must not send");
    },
    env.storage,
  );
  await other.load();
  assert.equal(other.getSnapshot(), null);
  await assert.rejects(other.open(), /Không còn/);
  assert.ok(client.getSnapshot().pending);
});

test("missing sessions clear drafts; auth failures preserve them for re-login", async () => {
  for (const code of ["UNAUTHORIZED", "SESSION_NOT_FOUND"]) {
    const env = setup();
    await env.client().open(start);
    const client = new QuizSessionClient(
      env.userId,
      async () => {
        throw failure(code);
      },
      env.storage,
    );
    await assert.rejects(client.open(), new RegExp(code));
    assert.equal(env.records.size, code === "SESSION_NOT_FOUND" ? 0 : 1);
  }
});

test("a question answered elsewhere refreshes authoritative state instead of retrying forever", async () => {
  const env = setup();
  await env.client().open(start);
  const client = new QuizSessionClient(
    env.userId,
    (route, options) => {
      if (route.endsWith("answers"))
        return Promise.reject(failure("QUESTION_ALREADY_ANSWERED"));
      return env.request(route, options);
    },
    env.storage,
  );
  await client.open();
  const result = await client.answer(questionId, choiceId);
  assert.equal(result.ket_qua, null);
  assert.equal(client.getSnapshot().pending, null);
});
