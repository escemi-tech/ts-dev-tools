import { updatePackageJson } from "../../services/packageJson";

export function up(absoluteProjectDir: string) {
  // Eslint
  const eslintConfig = {
    env: {
      browser: true,
      es2021: true,
    },
    extends: ["eslint:recommended", "prettier"],
    parser: "@typescript-eslint/parser",
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
      ecmaVersion: 12,
      sourceType: "module",
    },
    plugins: ["jest", "@typescript-eslint"],
    rules: {},
  };

  const prettier = {
    semi: true,
    printWidth: 100,
    trailingComma: "es5",
  };

  const husky = {
    hooks: {
      "pre-commit": "tsc && lint-staged && pretty-quick --staged",
      "pre-push": "yarn lint && yarn test",
    },
  };

  const lintStaged = {
    "*.{js,ts,tsx}": ["eslint --fix"],
  };

  const importSort = {
    ".js, .jsx, .ts, .tsx": {
      style: "module",
    },
  };

  const scripts = {
    lint: 'eslint "lib/**/*.{ts,tsx}"',
  };

  updatePackageJson(absoluteProjectDir, {
    eslintConfig,
    prettier,
    husky,
    "lint-staged": lintStaged,
    importSort,
    scripts,
  });
}
