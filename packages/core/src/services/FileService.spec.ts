import { writeFileSync } from "fs";
import { join } from "path";

import { createProjectForTestFile, deleteTestProject } from "../tests/test-project";
import { FileService } from "./FileService";

// Set to false to avoid using the cache
const useCache = true;
// Set to false to inspect the test project directory after the test
const shouldCleanupAfterTest = true;

describe("FileService", () => {
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

  describe("fileExists", () => {
    it("should return true when given file path exists", () => {
      const filePath = join(testProjectDir, `test-file-exits-${Date.now()}`);
      writeFileSync(filePath, "test");

      expect(FileService.fileExists(filePath)).toBe(true);
    });

    it("should return false when given file path does not exist", () => {
      const filePath = join(testProjectDir, `test-file-not-exits-${Date.now()}`);

      expect(FileService.fileExists(filePath)).toBe(false);
    });
  });

  describe("getFileContent", () => {
    it("should return the content of the file", () => {
      const filePath = join(testProjectDir, `test-file-get-content-${Date.now()}`);
      const content = "test content";

      FileService.putFileContent(filePath, content);

      expect(FileService.getFileContent(filePath)).toBe(content);
    });
  });

  describe("putFileContent", () => {
    it("should write the content to the file", () => {
      const filePath = join(testProjectDir, `test-file-put-content-${Date.now()}`);
      const content = "test content";

      FileService.putFileContent(filePath, content);

      expect(FileService.getFileContent(filePath)).toBe(content);
    });
  });

  describe("copyFile", () => {
    it("should copy the file", () => {
      const sourcePath = join(testProjectDir, `test-file-copy-source-${Date.now()}`);
      const destinationPath = join(testProjectDir, `test-file-copy-destination-${Date.now()}`);
      const content = "test content";

      FileService.putFileContent(sourcePath, content);
      FileService.copyFile(sourcePath, destinationPath);

      expect(FileService.getFileContent(destinationPath)).toBe(content);
    });
  });
});
