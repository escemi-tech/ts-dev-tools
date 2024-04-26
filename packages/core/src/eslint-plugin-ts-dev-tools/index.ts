// Must be duplicated "packages/core/eslint.config.mjs" and "packages/react/eslint.config.mjs" files

import globals from "globals";
import tseslint from "typescript-eslint";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pluginJs = require("@eslint/js");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const eslintConfigPrettier = require("eslint-config-prettier");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const eslintConfigJest = require("eslint-plugin-jest");

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
