import { PackageJson } from "../../services/PackageJson";
import { createProjectForTestFile, deleteTestProject } from "../../tests/test-project";
import { up } from "./20240617094000-config-nx-scopes";

// Set to false to avoid using the cache
const useCache = true;
// Set to false to inspect the test project directory after the test
const shouldCleanupAfterTest = true;

describe("Migration 20240617094000-config-nx-scopes", () => {
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
    });
  });
});
