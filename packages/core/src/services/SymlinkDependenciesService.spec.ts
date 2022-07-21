import { getConsoleInfoContent, mockConsoleInfo, resetMockedConsoleInfo } from "../tests/console";
import {
  createTestProjectDirWithFixtures,
  removeTestProjectDir,
  restorePackageJson,
} from "../tests/project";
import { SymlinkDependenciesService } from "./SymlinkDependenciesService";
import { PackageJson } from "./PackageJson";

describe("SymlinkDependenciesService", () => {
  let testProjectDir: string;

  beforeAll(() => {
    testProjectDir = createTestProjectDirWithFixtures(__filename);
  });

  afterAll(() => {
    removeTestProjectDir(__filename);
  });

  describe("executeSymlinking", () => {
    beforeEach(() => {
      mockConsoleInfo();
    });

    afterEach(() => {
      resetMockedConsoleInfo();
      restorePackageJson(__filename);
    });

    it("should symlink dependencies", () => {
      PackageJson.fromDirPath(testProjectDir).merge({
        devDependencies: {
          "@ts-dev-tools/core": "1.0.0",
        },
      });

      const executeSymlinkingAction = () =>
      SymlinkDependenciesService.executeSymlinking(testProjectDir);

      expect(executeSymlinkingAction).not.toThrowError();
      expect(getConsoleInfoContent()).toMatchSnapshot();
    });
  });
});
