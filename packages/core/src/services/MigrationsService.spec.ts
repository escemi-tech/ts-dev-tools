import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  getConsoleInfoContent,
  mockConsoleInfo,
  resetMockedConsoleInfo,
} from "../tests/console";
import {
  createProjectForTestFile,
  deleteTestProject,
} from "../tests/test-project";
import { GitService } from "./GitService";
import { HooksService } from "./HooksService";
import { MigrationsService } from "./MigrationsService";
import { PackageJson } from "./PackageJson";

// Set to false to avoid using the cache
const useCache = true;
// Set to false to inspect the test project directory after the test
const shouldCleanupAfterTest = true;

describe("MigrationsService", () => {
  let testProjectDir: string;

  beforeAll(() => {
    if (!useCache) {
      console.warn("Cache is disabled. Enable it one dev is done.");
    }
    if (!shouldCleanupAfterTest) {
      console.warn("Cleanup is disabled. Enable it one dev is done.");
    }
  });

  beforeEach(async () => {
    testProjectDir = await createProjectForTestFile(__filename, useCache);
    mockConsoleInfo();
  });

  afterEach(async () => {
    resetMockedConsoleInfo();
    if (shouldCleanupAfterTest) {
      await deleteTestProject(__filename);
    }
  });

  afterAll(() => {});

  describe("executeMigrations", () => {
    it("should execute migrations when no version is provided", async () => {
      PackageJson.fromDirPath(testProjectDir).merge({
        devDependencies: {
          "@ts-dev-tools/core": "1.0.0",
        },
      });

      const executeMigrationsAction = () =>
        MigrationsService.executeMigrations(testProjectDir, undefined);

      await expect(executeMigrationsAction()).resolves.toBeUndefined();

      expect(getConsoleInfoContent()).toMatchSnapshot();
    });

    it("should execute migrations when no available migrations exist after given version", async () => {
      PackageJson.fromDirPath(testProjectDir).merge({
        devDependencies: {
          "@ts-dev-tools/core": "1.0.0",
        },
      });

      const executeMigrationsAction = () =>
        MigrationsService.executeMigrations(
          testProjectDir,
          "20201024173398-init",
        );

      await expect(executeMigrationsAction()).resolves.toBeUndefined();
      expect(getConsoleInfoContent()).toMatchSnapshot();
    });

    it("should apply consolidated managed git hooks even when no migration needs to run", async () => {
      vi.spyOn(GitService, "isGitRepository").mockResolvedValue(true);

      PackageJson.fromDirPath(testProjectDir).merge({
        devDependencies: {
          "@ts-dev-tools/core": "1.0.0",
        },
      });

      const executeMigrationsAction = () =>
        MigrationsService.executeMigrations(
          testProjectDir,
          "20260604100000-migrate-to-vitest",
        );

      await expect(executeMigrationsAction()).resolves.toBeUndefined();

      const preCommitHookPath = join(
        testProjectDir,
        ".git",
        "hooks",
        "pre-commit",
      );
      const commitMsgHookPath = join(
        testProjectDir,
        ".git",
        "hooks",
        "commit-msg",
      );
      const prePushHookPath = join(testProjectDir, ".git", "hooks", "pre-push");

      expect(existsSync(preCommitHookPath)).toBe(true);
      expect(readFileSync(preCommitHookPath, "utf-8")).toBe(`#!/bin/sh

# Created by ts-dev-tools (https://escemi-tech.github.io/ts-dev-tools/)

npx --no-install biome check --error-on-warnings --staged --write --no-errors-on-unmatched`);

      expect(existsSync(commitMsgHookPath)).toBe(true);
      expect(readFileSync(commitMsgHookPath, "utf-8")).toBe(`#!/bin/sh

# Created by ts-dev-tools (https://escemi-tech.github.io/ts-dev-tools/)

npx --no-install commitlint --edit $1`);

      expect(existsSync(prePushHookPath)).toBe(true);
      expect(readFileSync(prePushHookPath, "utf-8")).toBe(`#!/bin/sh

# Created by ts-dev-tools (https://escemi-tech.github.io/ts-dev-tools/)

npm run lint && npm run build && npm run test`);
    });

    it("should restore package.json and rethrow when applying managed hooks fails", async () => {
      PackageJson.fromDirPath(testProjectDir).merge({
        devDependencies: {
          "@ts-dev-tools/core": "1.0.0",
        },
      });

      const restoreSpy = vi.spyOn(PackageJson.prototype, "restore");
      const applyManagedGitHooksError = new Error("Could not apply hooks");
      const applyManagedGitHooksSpy = vi
        .spyOn(HooksService, "applyManagedGitHooks")
        .mockRejectedValue(applyManagedGitHooksError);

      try {
        await expect(
          MigrationsService.executeMigrations(
            testProjectDir,
            "20260604100000-migrate-to-vitest",
          ),
        ).rejects.toThrow("Could not apply hooks");

        expect(restoreSpy).toHaveBeenCalledTimes(1);
      } finally {
        applyManagedGitHooksSpy.mockRestore();
        restoreSpy.mockRestore();
      }
    });
  });

  describe("getMigrationNameFromFile", () => {
    it("should retrieve migration name from given file name", async () => {
      const migrationFile = "20201024173398-test.ts";
      const migrationName =
        MigrationsService.getMigrationNameFromFile(migrationFile);

      expect(migrationName).toEqual("20201024173398-test");
    });
  });

  describe("migrationIsAfterCurrentVersion", () => {
    it("should retrieve true when migration name is after current version", async () => {
      const migrationName = "20210130173398-other-test";
      const currentVersion = "20201024173398-test";

      const migrationIsAfterCurrentVersion =
        MigrationsService.migrationIsAfterCurrentVersion(
          migrationName,
          currentVersion,
        );
      expect(migrationIsAfterCurrentVersion).toBe(true);
    });

    it("should retrieve false when migration name is before current version", async () => {
      const migrationName = "20201024173398-test";
      const currentVersion = "20210130173398-other-test";

      const migrationIsAfterCurrentVersion =
        MigrationsService.migrationIsAfterCurrentVersion(
          migrationName,
          currentVersion,
        );
      expect(migrationIsAfterCurrentVersion).toBe(false);
    });

    it("should retrieve true when current version is undefined", async () => {
      const migrationName = "20201024173398-test";

      const migrationIsAfterCurrentVersion =
        MigrationsService.migrationIsAfterCurrentVersion(migrationName);
      expect(migrationIsAfterCurrentVersion).toBe(true);
    });
  });
});
