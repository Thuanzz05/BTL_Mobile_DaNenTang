/* global __dirname */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

test("pronunciation uses device speech and cancels after leaving", async () => {
  const code = ts.transpileModule(
    fs.readFileSync(
      path.join(__dirname, "../hooks/use-pronunciation.ts"),
      "utf8",
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;

  for (const leave of [false, true]) {
    const calls = [];
    let cleanup;
    const exports = {};
    vm.runInNewContext(code, {
      exports,
      require: (name) =>
        ({
          react: {
            useState: (initial) => [initial, () => {}],
            useRef: (current) => ({ current }),
            useEffect: (effect) => {
              cleanup = effect();
            },
          },
          "expo-speech": {
            stop: async () => {},
            speak: (word, options) => calls.push([word, options.language]),
          },
        })[name],
    });

    const { pronounce } = exports.usePronunciation("hello");
    const speaking = pronounce();
    if (leave) cleanup();
    await speaking;
    assert.deepEqual(calls, leave ? [] : [["hello", "en-US"]]);
    cleanup();
  }
});
