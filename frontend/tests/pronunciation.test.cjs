/* global __dirname, URL */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

test("pronunciation uses uploaded audio, falls back to speech and cancels after leaving", async () => {
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
  for (const scenario of [
    "file",
    "missing",
    "load-error",
    "play-error",
    "leave",
  ]) {
    const calls = [];
    let source;
    let cleanup;
    const imports = {
      react: {
        useState: (initial) => [initial, () => {}],
        useRef: (current) => ({ current }),
        useEffect: (effect) => {
          cleanup = effect();
        },
      },
      "@/services/api": { API_URL: "http://localhost:5000/api" },
      "expo-speech": {
        stop: async () => {},
        speak: (word) => calls.push(word),
      },
      "expo-audio": {
        useAudioPlayer: (url) => {
          source = url;
          return {
            seekTo: async (time) => calls.push(time),
            play: () => {
              if (scenario === "play-error") throw new Error("audio failed");
              calls.push("play");
            },
          };
        },
        useAudioPlayerStatus: () => ({
          isLoaded: true,
          error: scenario === "load-error" ? "404" : null,
        }),
        setAudioModeAsync: async () => {},
      },
    };
    const exports = {};
    vm.runInNewContext(code, {
      exports,
      URL,
      require: (name) => imports[name],
    });
    const { pronounce } = exports.usePronunciation(
      "hello",
      scenario === "missing" ? null : "/uploads/hello.mp3",
    );
    assert.equal(
      source,
      scenario === "missing" ? null : "http://localhost:5000/uploads/hello.mp3",
    );
    const playing = pronounce();
    if (scenario === "leave") cleanup();
    await playing;
    assert.deepEqual(
      calls,
      scenario === "file"
        ? [0, "play"]
        : scenario === "play-error"
          ? [0, "hello"]
          : scenario === "leave"
            ? []
            : ["hello"],
    );
    cleanup();
  }
});
