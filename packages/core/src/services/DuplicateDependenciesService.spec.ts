import { getConsoleInfoContent, mockConsoleInfo, resetMockedConsoleInfo } from "../tests/console";
import { createProjectForTestFile, deleteTestProject } from "../tests/test-project";
import { DuplicateDependenciesService } from "./DuplicateDependenciesService";
import { PackageJson } from "./PackageJson";

// Set to false to avoid using the cache
const useCache = true;
// Set to false to inspect the test project directory after the test
const shouldCleanupAfterTest = true;

describe("DuplicateDependenciesService", () => {
  let testProjectDir: string;

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

  describe("executeDeduplication", () => {
    it("should duplicate dependencies when project has duplicates dev dependencies", () => {
      PackageJson.fromDirPath(testProjectDir).merge({
        devDependencies: {
          "@ts-dev-tools/core": "1.0.0",
          typescript: "1.0.0",
        },
      });

      const executeDeduplicationAction = () =>
        DuplicateDependenciesService.executeDeduplication(testProjectDir);

      expect(executeDeduplicationAction).not.toThrow();
      expect(getConsoleInfoContent()).toMatchSnapshot();
    });
  });
});
