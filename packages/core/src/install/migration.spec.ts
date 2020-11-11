import { resolve } from "path";

import { createTestProjectDir, removeTestProjectDir, restorePackageJson } from "../tests/utils";
import { executeMigrations, getAvailableMigrations } from "./migration";

describe("Migration", () => {
  let testProjectDir: string;

  beforeAll(() => {
    testProjectDir = createTestProjectDir(__filename);
  });

  afterAll(() => {
    removeTestProjectDir(__filename);
  });

  describe("getAvailableMigrations", () => {
    afterEach(() => {
      restorePackageJson(__filename);
    });

    it("should retrieve available migrations when no version is provided", () => {
      const availableMigrations = getAvailableMigrations(testProjectDir, testProjectDir, undefined);
      expect(availableMigrations).toEqual([
        {
          name: "20201024173398-init",
          path: resolve(__dirname, "migrations/20201024173398-init.ts"),
        },
      ]);
    });

    it("should retrieve an empty array when no available migrations exist after given version", () => {
      const availableMigrations = getAvailableMigrations(
        testProjectDir,
        testProjectDir,
        "20201024173398-init"
      );
      expect(availableMigrations).toEqual([]);
    });
  });

  describe("executeMigrations", () => {
    afterEach(() => {
      restorePackageJson(__filename);
    });

    it("should execute given migrations", () => {
      const executeMigrationsOperation = () => executeMigrations([], testProjectDir);
      expect(executeMigrationsOperation).not.toThrow();
    });
  });
});
