import { getConsoleInfoContent, mockConsoleInfo, resetMockedConsoleInfo } from "../tests/console";
import { createProjectForTestFile, deleteTestProject } from "../tests/test-project";
import { MigrationsService } from "./MigrationsService";
import { PackageJson } from "./PackageJson";

// Set to false to avoid using the cache
const useCache = true;
// Set to false to inspect the test project directory after the test
const shouldCleanupAfterTest = true;

describe("MigrationsService", () => {
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
    mockConsoleInfo();
  });

  afterEach(async () => {
    resetMockedConsoleInfo();
    if (shouldCleanupAfterTest) {
      await deleteTestProject(__filename);
    }
  });

  afterAll(() => {});

  describe("executeMigrations", () => {
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

  describe("getMigrationNameFromFile", () => {
    it("should retrieve migration name from given file name", async () => {
      const migrationFile = "20201024173398-test.ts";
      const migrationName = MigrationsService.getMigrationNameFromFile(migrationFile);

      expect(migrationName).toEqual("20201024173398-test");
    });
  });

  describe("migrationIsAfterCurrentVersion", () => {
    it("should retrieve true when migration name is after current version", async () => {
      const migrationName = "20210130173398-other-test";
      const currentVersion = "20201024173398-test";

      const migrationIsAfterCurrentVersion = MigrationsService.migrationIsAfterCurrentVersion(
        migrationName,
        currentVersion
      );
      expect(migrationIsAfterCurrentVersion).toBe(true);
    });

    it("should retrieve false when migration name is before current version", async () => {
      const migrationName = "20201024173398-test";
      const currentVersion = "20210130173398-other-test";

      const migrationIsAfterCurrentVersion = MigrationsService.migrationIsAfterCurrentVersion(
        migrationName,
        currentVersion
      );
      expect(migrationIsAfterCurrentVersion).toBe(false);
    });

    it("should retrieve true when current version is undefined", async () => {
      const migrationName = "20201024173398-test";

      const migrationIsAfterCurrentVersion =
        MigrationsService.migrationIsAfterCurrentVersion(migrationName);
      expect(migrationIsAfterCurrentVersion).toBe(true);
    });
  });
});
