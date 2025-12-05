import { PackageJson } from "../../services/PackageJson";
import { createProjectForTestFile, deleteTestProject } from "../../tests/test-project";
import { up } from "./20250623095600-remove-prettier-oxc";

// Set to false to avoid using the cache
const useCache = true;
// Set to false to inspect the test project directory after the test
const shouldCleanupAfterTest = true;

describe("Migration 20250623095600-remove-prettier-oxc", () => {
  let testProjectDir: string;

  beforeAll(async () => {
    if (!useCache) {
      console.warn("Cache is disabled. Enable it once dev is done.");
    }
    if (!shouldCleanupAfterTest) {
      console.warn("Cleanup is disabled. Enable it once dev is done.");
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
    it("should remove only @prettier/plugin-oxc from plugins array", async () => {
      // First, add the prettier oxc plugin to simulate the previous migration
      const packageJson = PackageJson.fromDirPath(testProjectDir);
      packageJson.merge({
        prettier: {
          plugins: ["@prettier/plugin-oxc"],
        },
      });

      // Apply the migration to remove it
      await up(testProjectDir);

      const packageJsonContent = PackageJson.fromDirPath(testProjectDir).getContent();

      expect(packageJsonContent).toMatchSnapshot();
    });

    it("should keep other plugins when removing @prettier/plugin-oxc", async () => {
      // Add prettier config with multiple plugins
      const packageJson = PackageJson.fromDirPath(testProjectDir);
      packageJson.merge({
        prettier: {
          plugins: ["@prettier/plugin-oxc", "prettier-plugin-other"],
        },
      });

      // Apply the migration
      await up(testProjectDir);

      const packageJsonContent = PackageJson.fromDirPath(testProjectDir).getContent();

      expect(packageJsonContent).toMatchSnapshot();
    });
  });
});
