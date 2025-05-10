import { PackageJson } from "@ts-dev-tools/core/dist/services/PackageJson";
import { up } from "./20201111162698-init";
import {
  createProjectForTestFile,
  deleteTestProject,
} from "@ts-dev-tools/core/dist/tests/test-project";

// Set to false to avoid using the cache
const useCache = true;
// Set to false to inspect the test project directory after the test
const shouldCleanupAfterTest = true;

describe("Migration 20201111162698-init", () => {
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

  describe("Up", () => {
    it("should apply migration", () => {
      up(testProjectDir);

      const packageJsonContent = PackageJson.fromDirPath(testProjectDir).getContent();

      expect(packageJsonContent).toMatchSnapshot();
    });

    it("should apply migration after core", () => {
      PackageJson.fromDirPath(testProjectDir).merge({
        eslintConfig: {
          env: {
            es2021: true,
          },
          extends: [
            "eslint:recommended",
            "plugin:@typescript-eslint/recommended",
            "plugin:jest/recommended",
            "prettier",
          ],
        },
        jest: {
          preset: "ts-jest",
          testEnvironment: "node",
        },
      });

      up(testProjectDir);

      const packageJsonContent = PackageJson.fromDirPath(testProjectDir).getContent();

      expect(packageJsonContent).toMatchSnapshot();
    });
  });
});
