/* global __dirname */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const exportsObject = {};
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync(path.join(__dirname, "../services/quiz.ts"), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText,
  { exports: exportsObject },
);
const { createQuiz, answerQuiz, nextQuestion, choicesFor } = exportsObject;
const words = ["A", "B", "C", "D"].map((id) => ({
  id,
  tu_tieng_anh: id,
  nghia_tieng_viet: "Meaning " + id,
}));
test("wrong answer returns after two intervening questions and requires extra correct answers", () => {
  let s = createQuiz(words);
  s = nextQuestion(answerQuiz(s, false));
  assert.equal(s.current, 1);
  s = nextQuestion(answerQuiz(s, true));
  assert.equal(s.current, 2);
  s = nextQuestion(answerQuiz(s, true));
  assert.equal(s.current, 0);
  assert.equal(s.items[0].mistakes, 1);
  s = answerQuiz(s, true);
  assert.equal(s.items[0].done, false);
  s = answerQuiz(s, true);
  assert.equal(s.items[0].done, false);
  s = answerQuiz(s, true);
  assert.equal(s.items[0].done, true);
});
test("all correct session finishes with two answers per word", () => {
  let s = createQuiz(words);
  let count = 0;
  while (s.current >= 0 && count++ < 20) s = nextQuestion(answerQuiz(s, true));
  assert.equal(s.current, -1);
  assert.equal(s.turn, 8);
  assert.equal(s.correct, 8);
});
test("mistake resets streak; choice meanings are unique and include correct answer", () => {
  let s = answerQuiz(createQuiz(words), true);
  s = answerQuiz(s, false);
  assert.equal(s.items[0].streak, 0);
  const choices = choicesFor(
    words[0],
    [...words, { ...words[1], id: "duplicate" }],
    () => 0.2,
  );
  assert.equal(choices.length, 4);
  assert.equal(new Set(choices).size, 4);
  assert.ok(choices.includes("Meaning A"));
});
