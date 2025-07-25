import { resolve } from "path";

import { PackageJson } from "@ts-dev-tools/core/dist/services/PackageJson";
import { exec, safeExec } from "@ts-dev-tools/core/dist/tests/cli";
import { deleteFolderRecursive } from "@ts-dev-tools/core/dist/tests/file-system";
import { createTestPackagesDir } from "@ts-dev-tools/core/dist/tests/test-packages";
import {
  createProjectForTestFile,
  deleteTestProject,
} from "@ts-dev-tools/core/dist/tests/test-project";
import { createTestMonorepoProject } from "@ts-dev-tools/core/dist/tests/test-project-monorepo";
import { stripAnsi } from "@ts-dev-tools/core/dist/tests/console";

// Set to false to avoid using the cache
const useCache = true;
// Set to false to inspect the test project directory after the test
const shouldCleanupAfterTest = true;

async function reactProjectGenerator(projectDir: string) {
  await safeExec(projectDir, "npm create vite . -- --template react-ts");
  await safeExec(projectDir, "npm install");
}

function removeInstallWarnings(installPackageStderr: string, packageToInstall: string): string {
  return installPackageStderr
    .split("\n")
    .filter((line) => {
      const lineWithoutColors = stripAnsi(line);
      return (
        !lineWithoutColors.includes(`warning "${packageToInstall}`) &&
        !lineWithoutColors.includes(`warning ${packageToInstall}`)
      );
    })
    .join("\n");
}

const packageToTest = "react";
describe(`E2E - ${packageToTest}`, () => {
  let testProjectDirPackages: string;
  let packageToInstall: string;

  beforeAll(async () => {
    if (!useCache) {
      console.warn("Cache is disabled. Enable it one dev is done.");
    }
    if (!shouldCleanupAfterTest) {
      console.warn("Cleanup is disabled. Enable it one dev is done.");
    }

    testProjectDirPackages = await createTestPackagesDir(__filename);
    const packagePath = resolve(testProjectDirPackages, "packages", packageToTest);
    packageToInstall = `${packagePath}`;
  }, 200000);

  afterEach(async () => {
    if (shouldCleanupAfterTest) {
      await deleteTestProject(__filename);
    }
  });

  afterAll(async () => {
    if (shouldCleanupAfterTest) {
      await deleteFolderRecursive(testProjectDirPackages);
    }
  });

  describe("Simple project", () => {
    let testProjectDir: string;

    beforeEach(async () => {
      testProjectDir = await createProjectForTestFile(__filename, useCache, reactProjectGenerator);
    }, 200000);

    it(`Installs ${packageToTest} package`, async () => {
      const { code: installPackageCode, stderr: installPackageStderr } = await exec(
        testProjectDir,
        `npm install --save-dev "${packageToInstall}"`
      );

      expect(removeInstallWarnings(installPackageStderr, packageToInstall)).toBeFalsy();
      expect(installPackageCode).toBe(0);

      const {
        code: installCode,
        stderr: stderrCode,
        stdout,
      } = await exec(testProjectDir, "npm exec ts-dev-tools install");

      expect(stripAnsi(stdout)).toMatchSnapshot();
      expect(stderrCode).toBeFalsy();
      expect(installCode).toBe(0);

      const packageJson = PackageJson.fromDirPath(testProjectDir);
      expect(packageJson.getTsDevToolsVersion()).not.toBeFalsy();
      expect(packageJson.getContent().scripts).toMatchSnapshot();
      expect(packageJson.getContent().prettier).toMatchSnapshot();
      expect(packageJson.getContent().jest).toMatchSnapshot();

      const { code: lintCode, stderr: lintStderr } = await exec(testProjectDir, "npm run lint");

      expect(lintStderr).toBeFalsy();
      expect(lintCode).toBe(0);

      const { code: buildCode, stderr: buildStderr } = await exec(testProjectDir, "npm run build");

      expect(buildStderr).toBeFalsy();
      expect(buildCode).toBe(0);
    }, 200000);
  });

  describe("Monorepo project", () => {
    let testProjectDir: string;

    beforeEach(async () => {
      testProjectDir = await createTestMonorepoProject(__filename, useCache, reactProjectGenerator);
    }, 200000);

    it(`Installs ${packageToTest} package`, async () => {
      const { code: installPackageCode, stderr: installPackageStderr } = await exec(
        testProjectDir,
        `npm install --save-dev -W "${packageToInstall}"`
      );

      expect(removeInstallWarnings(installPackageStderr, packageToInstall)).toBeFalsy();
      expect(installPackageCode).toBe(0);

      const {
        code: installCode,
        stderr: stderrCode,
        stdout,
      } = await exec(testProjectDir, "npm exec ts-dev-tools install");

      expect(stripAnsi(stdout)).toMatchSnapshot();
      expect(stderrCode).toBeFalsy();
      expect(installCode).toBe(0);

      const packageJson = PackageJson.fromDirPath(testProjectDir);
      expect(packageJson.getTsDevToolsVersion()).not.toBeFalsy();
    }, 200000);
  });
});
