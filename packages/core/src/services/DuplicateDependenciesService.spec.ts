import { getConsoleInfoContent, mockConsoleInfo, resetMockedConsoleInfo } from "../tests/console";
import {
  createTestProjectDirWithFixtures,
  removeTestProjectDir,
  restorePackageJson,
} from "../tests/project";
import { DuplicateDependenciesService } from "./DuplicateDependenciesService";
import { PackageJson } from "./PackageJson";

describe("DuplicateDependenciesService", () => {
  let testProjectDir: string;

  beforeAll(() => {
    testProjectDir = createTestProjectDirWithFixtures(__filename);
  });

  afterAll(() => {
    removeTestProjectDir(__filename);
  });

  describe("executeDeduplication", () => {
    beforeEach(() => {
      mockConsoleInfo();
    });

    afterEach(() => {
      resetMockedConsoleInfo();
      restorePackageJson(__filename);
    });

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
