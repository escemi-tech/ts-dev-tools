import { PROJECT_NAME } from "../../constants";
import { GitService } from "../../services/GitService";
import { MigrationUpFunction } from "../../services/MigrationsService";
import { PackageJson } from "../../services/PackageJson";
import { PackageManagerService } from "../../services/PackageManagerService";

export const up: MigrationUpFunction = async (absoluteProjectDir: string): Promise<void> => {
  const jest = {
    preset: "ts-jest",
    testEnvironment: "node",
    testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test)?(.*).+(ts|tsx|js)"],
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

  const packageManager = PackageManagerService.detectPackageManager(absoluteProjectDir);

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

  // Install Git hooks (only if we are in a git repository)
  const isGitRepository = await GitService.isGitRepository(absoluteProjectDir);

  if (isGitRepository) {
    const gitHooks = {
      "pre-commit": "npx --no-install lint-staged && npx --no-install pretty-quick --staged",
      "commit-msg": "npx --no-install commitlint --edit $1",
      "pre-push": `${packageManager} run lint && ${packageManager} run build && ${packageManager} run test`,
    };

    for (const gitHookName of Object.keys(gitHooks)) {
      const gitHookCommand = gitHooks[gitHookName as keyof typeof gitHooks];
      await GitService.addGitHook(absoluteProjectDir, gitHookName, gitHookCommand);
    }
  }
};
