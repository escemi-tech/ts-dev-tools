import { writeFileSync } from "fs";
import { join } from "path";

import { createTestProjectDir, removeTestProjectDir } from "../tests/utils";
import { PackageManagerService, PackageManagerType } from "./PackageManagerService";

describe("PackageManagerService", () => {
  let testProjectDir: string;

  beforeAll(() => {
    testProjectDir = createTestProjectDir(__filename);
  });

  afterAll(() => {
    removeTestProjectDir(__filename);
  });

  describe("detectPackageManager", () => {
    it("should retrieve the default package manager when no one is detectable", () => {
      const packageManager = PackageManagerService.detectPackageManager(testProjectDir);

      expect(packageManager).toEqual(PackageManagerType.npm);
    });

    it("should retrieve the yarn package manager when yarn.lock file exists", () => {
      writeFileSync(join(testProjectDir, "yarn.lock"), "test");

      const packageManager = PackageManagerService.detectPackageManager(testProjectDir);

      expect(packageManager).toEqual(PackageManagerType.yarn);
    });
  });
});
