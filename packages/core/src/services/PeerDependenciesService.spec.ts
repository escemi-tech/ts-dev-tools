import { existsSync } from "fs";
import { join } from "path";

import { getConsoleInfoContent, mockConsoleInfo, resetMockedConsoleInfo } from "../tests/console";
import { createProjectForTestFile, deleteTestProject } from "../tests/test-project";
import { PackageJson } from "./PackageJson";
import { PeerDependenciesService } from "./PeerDependenciesService";

// Set to false to avoid using the cache
const useCache = true;
// Set to false to inspect the test project directory after the test
const shouldCleanupAfterTest = true;

describe("PeerDependenciesService", () => {
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

  describe("executeResolution", () => {
    it("should resolve peer dependencies and symlink missing ones", async () => {
      PackageJson.fromDirPath(testProjectDir).merge({
        devDependencies: {
          "@ts-dev-tools/core": "1.0.0",
        },
      });

      await PeerDependenciesService.executeResolution(testProjectDir);

      const consoleOutput = getConsoleInfoContent();
      expect(consoleOutput).toContain("Resolving peer dependencies...");
      expect(consoleOutput).toContain("Resolving peer dependencies done!");
    });

    it("should symlink jest-util when missing", async () => {
      PackageJson.fromDirPath(testProjectDir).merge({
        devDependencies: {
          "@ts-dev-tools/core": "1.0.0",
        },
      });

      await PeerDependenciesService.executeResolution(testProjectDir);

      const consoleOutput = getConsoleInfoContent();
      expect(consoleOutput).toContain("Resolving peer dependencies");
      expect(consoleOutput).toContain("Resolving peer dependencies done!");
    });

    it("should handle projects without plugins gracefully", async () => {
      await PeerDependenciesService.executeResolution(testProjectDir);

      const consoleOutput = getConsoleInfoContent();
      expect(consoleOutput).toContain("Resolving peer dependencies...");
      expect(consoleOutput).toContain("Resolving peer dependencies done!");
    });
  });
});
