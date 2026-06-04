import { PROJECT_NAME } from "../../constants";
import type { ManagedGitHook } from "../../services/HooksService";
import type { MigrationUpFunction } from "../../services/MigrationsService";
import { PackageJson } from "../../services/PackageJson";
import { PackageManagerService } from "../../services/PackageManagerService";

function getPackageManagerCommand(absoluteProjectDir: string): string {
  return PackageManagerService.detectPackageManager(absoluteProjectDir);
}

export const hooks: ManagedGitHook[] = [
  {
    name: "pre-commit",
    command:
      "npx --no-install lint-staged && npx --no-install pretty-quick --staged",
  },
  {
    name: "commit-msg",
    command: "npx --no-install commitlint --edit $1",
  },
  {
    name: "pre-push",
    command: (absoluteProjectDir: string) => {
      const packageManager = getPackageManagerCommand(absoluteProjectDir);
      return `${packageManager} run lint && ${packageManager} run build && ${packageManager} run test`;
    },
  },
];

export const up: MigrationUpFunction = async (
  absoluteProjectDir: string,
): Promise<void> => {
  const jest = {
    preset: "ts-jest",
    testEnvironment: "node",
    testMatch: [
      "**/__tests__/**/*.[jt]s?(x)",
      "**/?(*.)+(spec|test)?(.*).+(ts|tsx|js)",
    ],
    collectCoverageFrom: ["**/src/**/*.[jt]s?(x)"],
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
    settings: {
      jest: {
        version: "detect",
      },
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

  const lintStaged = {
    "*.{js,ts,tsx}": ["eslint --fix"],
  };

  const importSort = {
    ".js, .jsx, .ts, .tsx": {
      style: "module",
      parser: "typescript",
    },
  };

  const packageManager =
    PackageManagerService.detectPackageManager(absoluteProjectDir);

  const scripts = {
    build: "tsc --noEmit",
    format: "prettier --write '**/*.js'",
    lint: 'eslint "src/**/*.{ts,tsx}"',
    jest: "jest --detectOpenHandles --forceExit",
    test: `${packageManager} run jest --maxWorkers=50%`,
    "test:watch": `${packageManager} run jest --watch --maxWorkers=25%`,
    "test:cov": `${packageManager} run test --coverage`,
    "test:ci": `${packageManager} run test:cov --runInBand`,
    prepare: `${PROJECT_NAME} install`,
  };

  const packageJson = PackageJson.fromDirPath(absoluteProjectDir);
  packageJson.merge({
    eslintConfig,
    prettier,
    commitlint,
    "lint-staged": lintStaged,
    importSort,
    scripts,
    jest,
  });
};
