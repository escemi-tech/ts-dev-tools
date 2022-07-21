import { mkdirSync } from "fs";
import { join, resolve } from "path";

import { PackageJson } from "./services/PackageJson";
import { exec, safeExec } from "./tests/cli";
import { deleteFolderRecursive } from "./tests/file-system";
import {
  createTestMonorepoProjectDir,
  createTestPackagesDir,
  createTestProjectDir,
  removeTestProjectDir,
} from "./tests/project";

const createTestTypescriptProjectDir = async (projectDir: string) => {
  await safeExec(
    projectDir,
    "git clone --depth=1 https://github.com/Microsoft/TypeScript-Node-Starter.git ./"
  );
  await safeExec(projectDir, `rm -f ./package-lock.json`);
};

const packageToTest = "core";
describe(`E2E - ${packageToTest}`, () => {
  let testProjectDir: string;
  let testProjectDirPackages: string;
  let packagePath: string;

  beforeAll(async () => {
    testProjectDir = createTestProjectDir(__filename);
    testProjectDirPackages = await createTestPackagesDir(testProjectDir);
    packagePath = resolve(testProjectDirPackages, packageToTest);
  });

  afterAll(() => removeTestProjectDir(__filename));

  describe("Simple project", () => {
    let testSimpleProjectDir: string;

    beforeEach(async () => {
      testSimpleProjectDir = join(testProjectDir, "simple-project");
      mkdirSync(testSimpleProjectDir);
      await createTestTypescriptProjectDir(testSimpleProjectDir);
      await safeExec(testSimpleProjectDir, "yarn install");
    }, 200000);

    afterEach(() => deleteFolderRecursive(testSimpleProjectDir));

    it(`Installs ${packageToTest} package`, async () => {
      const { code: installPackageCode, stderr: installPackageStderr } = await exec(
        testSimpleProjectDir,
        `yarn add --dev "file:/${packagePath}"`
      );
      expect(installPackageStderr).toBeFalsy();
      expect(installPackageCode).toBe(0);

      const {
        code: installCode,
        stderr: stderrCode,
        stdout,
      } = await exec(testSimpleProjectDir, "yarn ts-dev-tools install");

      expect(stdout).toMatchSnapshot();
      expect(stderrCode).toBeFalsy();
      expect(installCode).toBe(0);

      const packageJson = PackageJson.fromDirPath(testSimpleProjectDir);
      expect(packageJson.getTsDevToolsVersion()).not.toBeFalsy();

      const { code: lintCode, stderr: lintStderr } = await exec(testSimpleProjectDir, "yarn lint");

      expect(lintStderr).toBeFalsy();
      expect(lintCode).toBe(0);

      const { code: buildCode, stderr: buildStderr } = await exec(
        testSimpleProjectDir,
        "yarn build"
      );

      expect(buildStderr).toBeFalsy();
      expect(buildCode).toBe(0);

    }, 200000);
  });

  describe("Monorepo project", () => {
    let testMonorepoProjectDir: string;

    beforeEach(async () => {
      testMonorepoProjectDir = join(testProjectDir, "monorepo-project");
      mkdirSync(testMonorepoProjectDir);

      await createTestMonorepoProjectDir(testMonorepoProjectDir, createTestTypescriptProjectDir);
    }, 200000);

    afterEach(() => deleteFolderRecursive(testMonorepoProjectDir));

    it(`Installs ${packageToTest} package`, async () => {
      const { code: installPackageCode, stderr: installPackageStderr } = await exec(
        testMonorepoProjectDir,
        `yarn add -W --dev "file:${packagePath}"`
      );
      expect(installPackageStderr).toBeFalsy();
      expect(installPackageCode).toBe(0);

      const {
        code: installCode,
        stderr: stderrCode,
        stdout,
      } = await exec(testMonorepoProjectDir, "yarn ts-dev-tools install");

      expect(stdout).toMatchSnapshot();
      expect(stderrCode).toBeFalsy();
      expect(installCode).toBe(0);

      const packageJson = PackageJson.fromDirPath(testMonorepoProjectDir);
      expect(packageJson.getTsDevToolsVersion()).not.toBeFalsy();
    }, 200000);
  });
});
