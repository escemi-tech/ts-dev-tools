import { safeExec } from "../tests/cli";
import { createTestProjectDir, removeTestProjectDir } from "../tests/project";
import { PackageJson } from "./PackageJson";
import { PackageManagerService, PackageManagerType } from "./PackageManagerService";

describe("PackageManagerService", () => {
  let testProjectDir: string;

  describe("detectPackageManager", () => {
    beforeEach(async () => {
      testProjectDir = createTestProjectDir(__filename);
    });

    afterEach(() => {
      removeTestProjectDir(__filename);
    });

    it("should retrieve the default package manager when no one is detectable", () => {
      const packageManager = PackageManagerService.detectPackageManager(testProjectDir);

      expect(packageManager).toEqual(PackageManagerType.npm);
    });
  });

  describe.each([PackageManagerType.npm, PackageManagerType.yarn])(
    `with package manager %s`,
    (packageManagerType) => {
      const packageTypeTestFileName = __filename.replace(
        ".spec.ts",
        `-${packageManagerType}.spec.ts`
      );
      beforeEach(async () => {
        testProjectDir = createTestProjectDir(packageTypeTestFileName);
        await safeExec(testProjectDir, `${packageManagerType} init --yes`);
        await safeExec(testProjectDir, `${packageManagerType} install --silent`);
      });

      afterEach(() => {
        removeTestProjectDir(packageTypeTestFileName);
      });

      describe("detectPackageManager", () => {
        it("should retrieve the current package manager", () => {
          const packageManager = PackageManagerService.detectPackageManager(testProjectDir);

          expect(packageManager).toEqual(packageManagerType);
        });
      });

      describe("isPackageInstalled", () => {
        it("should return false if package is not installed", async () => {
          const isInstalled = await PackageManagerService.isPackageInstalled(
            "test-package",
            testProjectDir
          );

          expect(isInstalled).toBeFalsy();
        });

        it("should return true if package is installed", async () => {
          await PackageManagerService.addDevPackage("test-package", testProjectDir);

          const isInstalled = await PackageManagerService.isPackageInstalled(
            "test-package",
            testProjectDir
          );

          expect(isInstalled).toBeTruthy();
        });
      });

      describe("isMonorepo", () => {
        it("should return false if project is not a monorepo", async () => {
          const isMonorepo = await PackageManagerService.isMonorepo(testProjectDir);

          expect(isMonorepo).toBeFalsy();
        });

        it("should return true if project is a monorepo", async () => {
          await PackageJson.fromDirPath(testProjectDir).merge({
            private: true,
            workspaces: ["packages/*"],
          });

          const testPackageDir = `${testProjectDir}/packages/test-package`;

          await safeExec(testProjectDir, `mkdir -p packages/test-package`);
          await safeExec(testPackageDir, `${packageManagerType} init --yes`);

          const isMonorepo = await PackageManagerService.isMonorepo(testProjectDir);

          expect(isMonorepo).toBeTruthy();
        });
      });

      describe("addDevPackage", () => {
        it("should add a dev package", async () => {
          expect(
            await PackageManagerService.isPackageInstalled("test-package", testProjectDir)
          ).toBeFalsy();

          await PackageManagerService.addDevPackage("test-package", testProjectDir);

          expect(
            await PackageManagerService.isPackageInstalled("test-package", testProjectDir)
          ).toBeTruthy();
        });
      });
    },
    10000
  );
});
