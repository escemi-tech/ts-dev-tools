import { getConsoleInfoContent, mockConsoleInfo, resetMockedConsoleInfo } from "../tests/console";
import { createProjectForTestFile, deleteTestProject } from "../tests/test-project";
import { PackageJson } from "./PackageJson";
import { SymlinkDependenciesService } from "./SymlinkDependenciesService";

// Set to false to avoid using the cache
const useCache = true;
// Set to false to inspect the test project directory after the test
const shouldCleanupAfterTest = true;

describe("SymlinkDependenciesService", () => {
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

  describe("executeSymlinking", () => {
    it("should symlink dependencies", () => {
      PackageJson.fromDirPath(testProjectDir).merge({
        devDependencies: {
          "@ts-dev-tools/core": "1.0.0",
        },
      });

      const executeSymlinkingAction = () =>
        SymlinkDependenciesService.executeSymlinking(testProjectDir);

      expect(executeSymlinkingAction).not.toThrow();
      expect(getConsoleInfoContent()).toMatchSnapshot();
    });
  });
});
