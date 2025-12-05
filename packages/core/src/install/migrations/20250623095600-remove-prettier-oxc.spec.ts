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
      console.warn("Cache is disabled. Enable it one dev is done.");
    }
    if (!shouldCleanupAfterTest) {
      console.warn("Cleanup is disabled. Enable it one dev is done.");
    }

    testProjectDir = await createProjectForTestFile(__filename, useCache);
  });

  afterEach(async () => {
    if (shouldCleanupAfterTest) {
      await deleteTestProject(__filename);
    }
  });

  describe("Up", () => {
    it("should apply migration and remove prettier plugins", async () => {
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
  });
});
