import { existsSync, readFileSync, statSync, writeFileSync } from "fs";
import { join } from "path";

import { createProjectForTestFile, deleteTestProject } from "../tests/test-project";
import { GitService } from "./GitService";

// Set to false to avoid using the cache
const useCache = true;
// Set to false to inspect the test project directory after the test
const shouldCleanupAfterTest = true;

describe("GitService", () => {
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
  });

  afterEach(async () => {
    if (shouldCleanupAfterTest) {
      await deleteTestProject(__filename);
    }
  });

  describe("isGitRepository", () => {
    it("should return true when given absolute Project dir is not a git repository", async () => {
      const isGitRepository = await GitService.isGitRepository(__dirname);
      await expect(isGitRepository).toBe(true);
    });

    it("should return false when given absolute Project dir is not a git repository", async () => {
      const isGitRepository = await GitService.isGitRepository(testProjectDir);
      await expect(isGitRepository).toBe(false);
    });
  });

  describe("addGitHook", () => {
    it("should add a new git hook", async () => {
      const expectedGitCommitHookFile = join(testProjectDir, ".git/hooks/pre-commit");

      await GitService.addGitHook(testProjectDir, "pre-commit", "echo ok;");

      expect(existsSync(expectedGitCommitHookFile)).toBe(true);
      expect(readFileSync(expectedGitCommitHookFile).toString()).toBe(`#!/bin/sh

# Created by ts-dev-tools (https://escemi-tech.github.io/ts-dev-tools/)

echo ok;`);
    });

    it("should not override existing git hook", async () => {
      const expectedGitCommitHookFile = join(testProjectDir, ".git/hooks/pre-commit");
      const expectedGitCommitHookContent = "test";
      writeFileSync(expectedGitCommitHookFile, expectedGitCommitHookContent);

      await GitService.addGitHook(testProjectDir, "pre-commit", "echo ok;");

      expect(readFileSync(expectedGitCommitHookFile).toString()).toBe(expectedGitCommitHookContent);
    });

    it("should set right permissions on existing git hook", async () => {
      const expectedGitCommitHookFile = join(testProjectDir, ".git/hooks/pre-commit");
      const expectedGitCommitHookContent = "test";
      writeFileSync(expectedGitCommitHookFile, expectedGitCommitHookContent, { mode: 0o644 });
      const { mode: originalMode } = statSync(expectedGitCommitHookFile);

      expect(parseInt(originalMode.toString(8), 10)).toBe(100644);

      await GitService.addGitHook(testProjectDir, "pre-commit", "echo ok;");

      const { mode: newMode } = statSync(expectedGitCommitHookFile);
      expect(newMode & parseInt("777", 8)).toBe(0o755);
    });
  });
});
