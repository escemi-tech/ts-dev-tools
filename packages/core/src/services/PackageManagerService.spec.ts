import { existsSync, unlinkSync, writeFileSync } from "fs";
import { safeExec } from "../tests/cli";
import { createProjectForTestFile, deleteTestProject } from "../tests/test-project";
import { PackageJson } from "./PackageJson";
import { PackageManagerService, PackageManagerType } from "./PackageManagerService";

// Set to false to avoid using the cache
const useCache = true;
// Set to false to inspect the test project directory after the test
const shouldCleanupAfterTest = true;

describe("PackageManagerService", () => {
  let testProjectDir: string;

  beforeAll(() => {
    if (!useCache) {
      console.warn("Cache is disabled. Enable it one dev is done.");
    }
    if (!shouldCleanupAfterTest) {
      console.warn("Cleanup is disabled. Enable it one dev is done.");
    }
  });

  describe("detectPackageManager", () => {
    beforeEach(async () => {
      testProjectDir = await createProjectForTestFile(__filename, useCache);
    });

    afterEach(async () => {
      if (shouldCleanupAfterTest) {
        await deleteTestProject(__filename);
      }
    });

    it("should throws an error when no package manager is detectable", () => {
      // Remove all lock files to ensure no package manager is detected
      const lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
      lockFiles.forEach(lockFile => {
        const lockFilePath = `${testProjectDir}/${lockFile}`;
        if (existsSync(lockFilePath)) {
          unlinkSync(lockFilePath);
        }
      });
      
      expect(() => {
        PackageManagerService.detectPackageManager(testProjectDir);
      }).toThrow(`Could not detect package manager in directory: ${testProjectDir}. No lock file found.`);
    });
  });

  describe.each([PackageManagerType.npm, PackageManagerType.yarn, PackageManagerType.pnpm])(
    `with package manager %s`,
    (packageManagerType) => {
      const packageTypeTestFileName = __filename.replace(
        ".spec.ts",
        `-${packageManagerType}.spec.ts`
      );

      beforeEach(async () => {
        testProjectDir = await createProjectForTestFile(packageTypeTestFileName, useCache);

        // Remove all lock files to start fresh
        const lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
        lockFiles.forEach(lockFile => {
          const lockFilePath = `${testProjectDir}/${lockFile}`;
          if (existsSync(lockFilePath)) {
            unlinkSync(lockFilePath);
          }
        });

        if (packageManagerType === PackageManagerType.pnpm) {
          // Check if package.json already exists to avoid pnpm init error
          const packageJsonPath = `${testProjectDir}/package.json`;
          if (!existsSync(packageJsonPath)) {
            await safeExec(testProjectDir, `${packageManagerType} init`);
          }
          // Create pnpm-lock.yaml to indicate pnpm usage
          writeFileSync(`${testProjectDir}/pnpm-lock.yaml`, 'lockfileVersion: \'9.0\'\n');
          await safeExec(testProjectDir, `${packageManagerType} install --silent`);
        } else {
          await safeExec(testProjectDir, `${packageManagerType} init --yes`);
          await safeExec(testProjectDir, `${packageManagerType} install --silent`);
        }
      });

      afterEach(async () => {
        if (shouldCleanupAfterTest) {
          await deleteTestProject(packageTypeTestFileName);
        }
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

          await safeExec(testProjectDir, `mkdir -p ${testPackageDir}`);

          if (packageManagerType === PackageManagerType.pnpm) {
            // For pnpm, also create a pnpm-workspace.yaml file
            writeFileSync(`${testProjectDir}/pnpm-workspace.yaml`, 'packages:\n  - "packages/*"\n');
            // pnpm init doesn't support --yes flag
            await safeExec(testPackageDir, `${packageManagerType} init`);
          } else {
            await safeExec(testPackageDir, `${packageManagerType} init --yes`);
          }

          await safeExec(testProjectDir, `${packageManagerType} install`);

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

      describe("getNodeModulesPath", () => {
        it("should return the node_modules path", async () => {
          const nodeModulesPath = await PackageManagerService.getNodeModulesPath(testProjectDir);

          expect(nodeModulesPath).toEqual(`${testProjectDir}/node_modules`);
        });
      });
    },
    10000
  );
});
