import { PackageJson } from "@ts-dev-tools/core/dist/services/PackageJson";
import {
  createTestProjectDirWithFixtures,
  removeTestProjectDir,
  restorePackageJson,
} from "@ts-dev-tools/core/dist/tests/project";
import { up } from "./20240412185501-eslint-config";
import { FileService } from "@ts-dev-tools/core/dist/services/FileService";

describe("Migration 20240412185501-eslint-config", () => {
  let testProjectDir: string;

  beforeAll(() => {
    testProjectDir = createTestProjectDirWithFixtures(__filename);
  });

  afterAll(() => {
    removeTestProjectDir(__filename);
  });

  describe("Up", () => {
    afterEach(() => {
      restorePackageJson(__filename);
    });

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
