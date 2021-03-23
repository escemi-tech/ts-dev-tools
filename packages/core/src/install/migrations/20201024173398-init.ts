import { writeFileSync } from "fs";
import { join } from "path";

import { CmdService } from "../../services/CliService";
import { PackageJson } from "../../services/PackageJson";
import { MigrationUpFunction } from "../MigrationsService";

export const up: MigrationUpFunction = async (absoluteProjectDir: string): Promise<void> => {
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
    build: "tsc --noEmit",
    test: "jest",
    lint: 'eslint "src/**/*.{ts,tsx}"',
    prepare: "ts-dev-tools install",
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
  const isGitRepository = await CmdService.execCmd("git rev-parse", absoluteProjectDir, true)
    .then(() => true)
    .catch(() => false);

  if (isGitRepository) {
    const gitHooks = {
      "pre-commit": "npx --no-install lint-staged && npx --no-install pretty-quick --staged",
      "commit-msg": "npx --no-install commitlint --edit \\$1",
      "pre-push": "yarn lint && yarn build && yarn test",
    };

    const gitHookDirPath = join(absoluteProjectDir, ".git/hooks");

    for (const gitHookFileName of Object.keys(gitHooks)) {
      const gitHookFilePath = join(gitHookDirPath, gitHookFileName);
      const gitHookCommand = gitHooks[gitHookFileName as keyof typeof gitHooks];
      writeFileSync(
        gitHookFilePath,
        `#!/bin/sh
# Created by ts-dev-tools (https://escemi-tech.github.io/ts-dev-tools/)
${gitHookCommand}`
      );
    }
  }
};
