import { FileService } from "../../services/FileService";
import { PackageJson } from "../../services/PackageJson";
import {
  createTestProjectDirWithFixtures,
  removeTestProjectDir,
  restorePackageJson,
} from "../../tests/project";
import { up } from "./20240412185500-eslint-config";

describe("Migration 20240412185500-eslint-config", () => {
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
