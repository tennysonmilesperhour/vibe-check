import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginUnusedImports from "eslint-plugin-unused-imports";

// Flat-config note: spreading multiple configs into ONE object makes later
// `rules` keys REPLACE earlier ones (this previously wiped no-undef, which is
// how an undefined <Heart /> reached production). Keep them as separate
// array entries so rules merge.
export default [
  {
    files: ["src/**/*.{js,mjs,cjs,jsx}"],
    ignores: ["src/components/ui/**/*"],
    ...pluginJs.configs.recommended,
  },
  {
    files: ["src/**/*.{js,mjs,cjs,jsx}"],
    ignores: ["src/components/ui/**/*"],
    languageOptions: {
      globals: {
        ...globals.browser,
        __BUILD_ID__: "readonly",
        __BUILD_ENVIRONMENT__: "readonly",
      },
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    settings: { react: { version: "detect" } },
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "unused-imports": pluginUnusedImports,
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": "off",
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "error",
      "react/jsx-no-undef": "error",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        { vars: "all", varsIgnorePattern: "^_", args: "after-used", argsIgnorePattern: "^_" },
      ],
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/no-unknown-property": ["error", { ignore: ["cmdk-input-wrapper", "toast-close"] }],
      "react-hooks/rules-of-hooks": "error",
    },
  },
  // Browser tests: Node code, with callbacks that run in the page.
  {
    files: ["e2e/**/*.js", "playwright.config.js"],
    ...pluginJs.configs.recommended,
  },
  {
    files: ["e2e/**/*.js", "playwright.config.js"],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
      parserOptions: { ecmaVersion: 2022, sourceType: "module" },
    },
    plugins: { "unused-imports": pluginUnusedImports },
    rules: {
      "no-undef": "error",
      "no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": ["warn", { vars: "all", args: "after-used", argsIgnorePattern: "^_" }],
    },
  },
];
