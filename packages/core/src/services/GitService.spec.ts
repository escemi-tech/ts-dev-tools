import { existsSync, readFileSync, statSync, writeFileSync } from "fs";
import { join } from "path";

import { createTestProjectDirWithFixtures, removeTestProjectDir } from "../tests/project";
import { GitService } from "./GitService";

describe("GitService", () => {
  let testProjectDir: string;

  beforeAll(() => {
    testProjectDir = createTestProjectDirWithFixtures(__filename);
  });

  afterAll(() => {
    removeTestProjectDir(__filename);
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
      writeFileSync(expectedGitCommitHookFile, expectedGitCommitHookContent);
      const { mode: originalMode } = statSync(expectedGitCommitHookFile);

      expect(parseInt(originalMode.toString(8), 10)).toBe(100755);

      await GitService.addGitHook(testProjectDir, "pre-commit", "echo ok;");

      const { mode: newMode } = statSync(expectedGitCommitHookFile);
      expect(newMode & parseInt("777", 8)).toBe(0o755);
    });
  });
});
