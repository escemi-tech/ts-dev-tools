import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  createProjectForTestFile,
  deleteTestProject,
} from "../tests/test-project";
import { GitService } from "./GitService";
import { HooksService } from "./HooksService";

// Set to false to avoid using the cache
const useCache = true;
// Set to false to inspect the test project directory after the test
const shouldCleanupAfterTest = true;

describe("HooksService", () => {
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

  describe("consolidateManagedGitHooks", () => {
    it("should keep the previous managed command as legacy when a hook changes", () => {
      const managedGitHooks = new Map();

      HooksService.consolidateManagedGitHooks(
        testProjectDir,
        [{ name: "pre-commit", command: "echo old;" }],
        managedGitHooks,
      );
      HooksService.consolidateManagedGitHooks(
        testProjectDir,
        [{ name: "pre-commit", command: "echo new;" }],
        managedGitHooks,
      );

      expect(Array.from(managedGitHooks.values())).toEqual([
        {
          name: "pre-commit",
          command: "echo new;",
          legacyCommands: ["echo old;"],
        },
      ]);
    });

    it("should resolve hook commands provided as functions", () => {
      const managedGitHooks = new Map();

      HooksService.consolidateManagedGitHooks(
        testProjectDir,
        [
          {
            name: "pre-push",
            command: (absoluteProjectDir: string) =>
              `echo ${absoluteProjectDir};`,
          },
        ],
        managedGitHooks,
      );

      expect(Array.from(managedGitHooks.values())).toEqual([
        {
          name: "pre-push",
          command: `echo ${testProjectDir};`,
          legacyCommands: [],
        },
      ]);
    });
  });

  describe("applyManagedGitHooks", () => {
    it("should do nothing when the project is not a git repository", async () => {
      const isGitRepositorySpy = vi
        .spyOn(GitService, "isGitRepository")
        .mockResolvedValue(false);
      const addGitHookSpy = vi.spyOn(GitService, "addGitHook");

      try {
        await expect(
          HooksService.applyManagedGitHooks(testProjectDir, [
            {
              name: "pre-commit",
              command: "echo new;",
              legacyCommands: ["echo old;"],
            },
          ]),
        ).resolves.toBeUndefined();

        expect(addGitHookSpy).not.toHaveBeenCalled();
      } finally {
        addGitHookSpy.mockRestore();
        isGitRepositorySpy.mockRestore();
      }
    });

    it("should update a managed hook from a legacy command", async () => {
      vi.spyOn(GitService, "isGitRepository").mockResolvedValue(true);

      const gitHookFilePath = join(
        testProjectDir,
        ".git",
        "hooks",
        "pre-commit",
      );
      writeFileSync(
        gitHookFilePath,
        GitService.GIT_HOOK_TEMPLATE.replace("%gitHookCommand%", "echo old;"),
      );

      await HooksService.applyManagedGitHooks(testProjectDir, [
        {
          name: "pre-commit",
          command: "echo new;",
          legacyCommands: ["echo old;"],
        },
      ]);

      expect(existsSync(gitHookFilePath)).toBe(true);
      expect(readFileSync(gitHookFilePath, "utf-8")).toBe(`#!/bin/sh

# Created by ts-dev-tools (https://escemi-tech.github.io/ts-dev-tools/)

echo new;`);
    });
  });
});
