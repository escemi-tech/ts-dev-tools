import { getConsoleInfoContent, mockConsoleInfo, resetMockedConsoleInfo } from "../tests/console";
import {
  createTestProjectDir,
  getTsDevToolsRootPath,
  removeTestProjectDir,
  restorePackageJson,
} from "../tests/utils";
import { DuplicateDependenciesService } from "./DuplicateDependenciesService";
import { PackageJson } from "./PackageJson";

describe("DuplicateDependenciesService", () => {
  let testProjectDir: string;

  beforeAll(() => {
    testProjectDir = createTestProjectDir(__filename);
  });

  afterAll(() => {
    removeTestProjectDir(__filename);
  });

  describe("duplicateDependencies", () => {
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

      const duplicateDependenciesAction = () =>
        DuplicateDependenciesService.duplicateDependencies(
          getTsDevToolsRootPath(__filename),
          testProjectDir
        );

      expect(duplicateDependenciesAction).not.toThrowError();
      expect(getConsoleInfoContent()).toMatchSnapshot();
    });
  });
});
