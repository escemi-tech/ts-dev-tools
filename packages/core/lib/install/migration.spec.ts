import { createTestProjectDir, removeTestProjectDir, restorePackageJson } from "../tests/utils";
import { executeMigrations } from "./migration";

describe("Migration", () => {
  let testProjectDir: string;

  beforeAll(() => {
    testProjectDir = createTestProjectDir(__filename);
  });

  afterAll(() => {
    removeTestProjectDir(__filename);
  });

  describe("executeMigrations", () => {
    afterEach(() => {
      restorePackageJson(__filename);
    });

    it("should execute all migrations when no version is provided", () => {
      executeMigrations(testProjectDir, undefined);
    });
  });
});
