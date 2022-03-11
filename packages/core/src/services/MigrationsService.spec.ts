import { getConsoleInfoContent, mockConsoleInfo, resetMockedConsoleInfo } from "../tests/console";
import {
  createTestProjectDirWithFixtures,
  removeTestProjectDir,
  restorePackageJson,
} from "../tests/project";
import { MigrationsService } from "./MigrationsService";
import { PackageJson } from "./PackageJson";

describe("MigrationsService", () => {
  let testProjectDir: string;

  beforeAll(() => {
    testProjectDir = createTestProjectDirWithFixtures(__filename);
  });

  afterAll(() => {
    removeTestProjectDir(__filename);
  });

  describe("executeMigrations", () => {
    beforeEach(() => {
      mockConsoleInfo();
    });

    afterEach(() => {
      resetMockedConsoleInfo();
      restorePackageJson(__filename);
    });

    it("should execute migrations when no version is provided", async () => {
      PackageJson.fromDirPath(testProjectDir).merge({
        devDependencies: {
          "@ts-dev-tools/core": "1.0.0",
        },
      });

      const executeMigrationsAction = () =>
        MigrationsService.executeMigrations(testProjectDir, undefined);

      await expect(executeMigrationsAction()).resolves.toBeUndefined();

      expect(getConsoleInfoContent()).toMatchSnapshot();
    });

    it("should execute migrations when no available migrations exist after given version", async () => {
      PackageJson.fromDirPath(testProjectDir).merge({
        devDependencies: {
          "@ts-dev-tools/core": "1.0.0",
        },
      });

      const executeMigrationsAction = () =>
        MigrationsService.executeMigrations(testProjectDir, "20201024173398-init");

      await expect(executeMigrationsAction()).resolves.toBeUndefined();
      expect(getConsoleInfoContent()).toMatchSnapshot();
    });
  });
});
