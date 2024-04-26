// Must be duplicated "packages/core/eslint.config.mjs"

import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintConfigJest from "eslint-plugin-jest";

export default [
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    languageOptions: { globals: globals.jest },
    files: ["**/src/**/__tests__/**/*.[jt]s?(x)", "**/src/**/?(*.)+(spec|test)?(.*).+(ts|tsx|js)"],
    ...eslintConfigJest.configs["flat/recommended"],
    rules: {
      ...eslintConfigJest.configs["flat/recommended"].rules,
      "jest/prefer-expect-assertions": "off",
    },
  },
];
