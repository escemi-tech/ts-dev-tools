import { PackageJson } from "@ts-dev-tools/core/dist/services/PackageJson";
import {
  createTestProjectDirWithFixtures,
  removeTestProjectDir,
  restorePackageJson,
} from "@ts-dev-tools/core/dist/tests/project";

import { up } from "./20201111162698-init";

describe("Migration 20201111162698-init", () => {
  let testProjectDir: string;

  beforeAll(() => {
    testProjectDir = createTestProjectDirWithFixtures(__filename);
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

      const packageJsonContent = PackageJson.fromDirPath(testProjectDir).getContent();

      expect(packageJsonContent).toMatchSnapshot();
    });

    it("should apply migration after core", () => {
      PackageJson.fromDirPath(testProjectDir).merge({
        eslintConfig: {
          env: {
            es2021: true,
          },
          extends: [
            "eslint:recommended",
            "plugin:@typescript-eslint/recommended",
            "plugin:jest/recommended",
            "prettier",
          ],
        },
        jest: {
          preset: "ts-jest",
          testEnvironment: "node",
        },
      });

      up(testProjectDir);

      const packageJsonContent = PackageJson.fromDirPath(testProjectDir).getContent();

      expect(packageJsonContent).toMatchSnapshot();
    });
  });
});
