import { PackageJson } from "@ts-dev-tools/core/dist/services/PackageJson";
import { FileService } from "@ts-dev-tools/core/dist/services/FileService";
import { up } from "./20240412185501-eslint-config";
import {
  createProjectForTestFile,
  deleteTestProject,
} from "@ts-dev-tools/core/dist/tests/test-project";

// Set to false to avoid using the cache
const useCache = true;
// Set to false to inspect the test project directory after the test
const shouldCleanupAfterTest = true;

describe("Migration 20240412185501-eslint-config", () => {
  let testProjectDir: string;

  beforeEach(async () => {
    testProjectDir = await createProjectForTestFile(__filename, useCache);
  });

  afterEach(async () => {
    if (shouldCleanupAfterTest) {
      await deleteTestProject(__filename);
    }
  });

  describe("Up", () => {
    it("should apply migration", async () => {
      await up(testProjectDir);

      const packageJsonContent = PackageJson.fromDirPath(testProjectDir).getContent();

      expect(packageJsonContent).toMatchSnapshot();

      const eslintConfigFilePath = `${testProjectDir}/eslint.config.mjs`;

      expect(FileService.fileExists(eslintConfigFilePath)).toBe(true);

      const eslintConfigContent = FileService.getFileContent(eslintConfigFilePath);
      expect(eslintConfigContent).toMatchSnapshot();
    });
  });
});
