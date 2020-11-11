import { readPackageJson } from "../../services/packageJson";
import { createTestProjectDir, removeTestProjectDir, restorePackageJson } from "../../tests/utils";
import { up } from "./20201024173398-init";

describe("Migration 20201024173398-init", () => {
  let testProjectDir: string;

  beforeAll(() => {
    testProjectDir = createTestProjectDir(__filename);
  });

  afterAll(() => {
    removeTestProjectDir(__filename);
  });

  describe("Up", () => {
    afterEach(() => {
      restorePackageJson(__filename);
    });

    it("should apply migration", () => {
      up(testProjectDir);

      const packageJson = readPackageJson(testProjectDir);

      expect(packageJson).toMatchObject({
        eslintConfig: {},
        prettier: {},
        husky: {},
        "lint-staged": {},
        importSort: {},
        scripts: {},
      });
    });
  });
});
