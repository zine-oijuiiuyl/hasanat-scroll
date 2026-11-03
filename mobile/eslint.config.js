// https://docs.expo.dev/guides/using-eslint/  Run with `npm run lint`.
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    // Generated files (see the script named at the top of each).
    ignores: ["dist/*", "scripts/*", "src/web-data.js", "src/recite-data.js", "src/voice-data.js", "src/hadith-long.js", "src/learn-data.js"],
  },
  {
    rules: {
      // React Native's Animated values live in useRef(new Animated.Value(0)).current and are read while
      // drawing; that is the documented pattern, which this React Compiler rule doesn't know about.
      "react-hooks/refs": "off",
      // Random positions are drawn once per particle (useState/useMemo initialisers); keep it as a hint.
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-effect": "warn",
      // Many native calls are best-effort and ignore their error on purpose.
      "no-unused-vars": ["warn", { caughtErrors: "none", argsIgnorePattern: "^_" }],
    },
  },
]);
