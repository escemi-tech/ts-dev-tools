import { updatePackageJson } from "../../services/packageJson";

export function up(absoluteProjectDir: string): void {
  const jest = {
    preset: "ts-jest",
    testEnvironment: "node",
    testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).+(ts|tsx|js)"],
  };

  const eslintConfig = {
    root: true,
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint", "jest"],
    extends: [
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:jest/recommended",
      "prettier",
    ],
    env: {
      es2021: true,
    },
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
      ecmaVersion: 12,
      sourceType: "module",
    },
  };

  const prettier = {
    semi: true,
    printWidth: 100,
    trailingComma: "es5",
  };

  const commitlint = {
    extends: ["@commitlint/config-conventional"],
  };

  const husky = {
    hooks: {
      "pre-commit": "tsc --noEmit && lint-staged && pretty-quick --staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS",
      "pre-push": "yarn lint && yarn test",
    },
  };

  const lintStaged = {
    "*.{js,ts,tsx}": ["eslint --fix"],
  };

  const importSort = {
    ".js, .jsx, .ts, .tsx": {
      style: "module",
      parser: "typescript",
    },
  };

  const scripts = {
    test: "jest",
    lint: 'eslint "src/**/*.{ts,tsx}"',
    postinstall: "ts-dev-tools install",
  };

  updatePackageJson(absoluteProjectDir, {
    eslintConfig,
    prettier,
    commitlint,
    husky,
    "lint-staged": lintStaged,
    importSort,
    scripts,
    jest,
  });
}
