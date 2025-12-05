import { resolve } from "path";

import { PackageJson } from "./services/PackageJson";
import { exec, safeExec } from "./tests/cli";
import { createProjectForTestFile, deleteTestProject } from "./tests/test-project";
import { createTestMonorepoProject } from "./tests/test-project-monorepo";
import { createTestPackagesDir } from "./tests/test-packages";
import { deleteFolderRecursive } from "./tests/file-system";
import { stripAnsi } from "./tests/console";

// Set to false to avoid using the cache
const useCache = true;
// Set to false to inspect the test project directory after the test
const shouldCleanupAfterTest = true;

async function typescriptProjectGenerator(projectDir: string) {
  await safeExec(projectDir, "npm create vite . -- --template vanilla-ts --no-interactive");
  await safeExec(projectDir, "npm install");
}


const packageToTest = "core";
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
      testProjectDir = await createProjectForTestFile(
        __filename,
        useCache,
        typescriptProjectGenerator
      );
    }, 200000);

    it(`Installs ${packageToTest} package`, async () => {
      const { code: installPackageCode, stderr: installPackageStderr } = await exec(
        testProjectDir,
        `npm install --save-dev "${packageToInstall}"`
      );

      expect(installPackageStderr).toBeFalsy();
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

      const { code: formatCode, stderr: formatStderr } = await exec(testProjectDir, "npm run format");

      expect(formatStderr).toBeFalsy();
      expect(formatCode).toBe(0);
    }, 200000);
  });

  describe("Monorepo project", () => {
    let testProjectDir: string;

    beforeEach(async () => {
      testProjectDir = await createTestMonorepoProject(
        __filename,
        useCache,
        typescriptProjectGenerator
      );
    }, 200000);

    it(`Installs ${packageToTest} package`, async () => {
      const { code: installPackageCode, stderr: installPackageStderr } = await exec(
        testProjectDir,
        `npm install --save-dev "${packageToInstall}"`
      );

      expect(installPackageStderr).toBeFalsy();
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
