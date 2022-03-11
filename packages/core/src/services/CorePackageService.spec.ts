import { CorePackageService } from "./CorePackageService";

describe("CorePackageService", () => {
  describe("getPackageRootPath", () => {
    it("should return the root directory paht of the core package", () => {
      const packageRootPath = CorePackageService.getPackageRootPath();
      expect(packageRootPath).toContain("ts-dev-tools/packages/core");
    });
  });

  describe("getPackageName", () => {
    it("should return name the core package", () => {
      const packageRootPath = CorePackageService.getPackageName();
      expect(packageRootPath).toEqual("@ts-dev-tools/core");
    });
  });
});
