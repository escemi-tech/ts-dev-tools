import { PackageJson } from "@ts-dev-tools/core/dist/services/PackageJson";
import {
  createTestProjectDir,
  removeTestProjectDir,
  restorePackageJson,
} from "@ts-dev-tools/core/dist/tests/utils";

import { up } from "./20201111162698-init";

describe("Migration 20201111162698-init", () => {
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

      const packageJsonContent = PackageJson.fromDirPath(testProjectDir).getContent();

      expect(packageJsonContent).toMatchSnapshot();
    });
  });
});
