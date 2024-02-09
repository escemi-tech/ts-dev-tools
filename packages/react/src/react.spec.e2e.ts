import { existsSync, mkdirSync } from "fs";
import { basename, join, resolve } from "path";

import { PackageJson } from "@ts-dev-tools/core/dist/services/PackageJson";
import { exec, safeExec } from "@ts-dev-tools/core/dist/tests/cli";
import { deleteFolderRecursive } from "@ts-dev-tools/core/dist/tests/file-system";
import {
  createTestMonorepoProjectDir,
  createTestPackagesDir,
  createTestProjectDir,
  removeTestProjectDir,
} from "@ts-dev-tools/core/dist/tests/project";

const createTestReactProjectDir = async (projectDir: string) => {
  await safeExec(projectDir, "yarn create react-app . --template typescript");
};

const packageToTest = "react";
describe(`E2E - ${packageToTest}`, () => {
  let testProjectDir: string;
  let testProjectTmpDir: string;
  let testProjectDirPackages: string;
  let packagePath: string;

  beforeAll(async () => {
    testProjectDir = createTestProjectDir(__filename);

    testProjectTmpDir = join(__dirname, "../../../node_modules/.cache/", basename(testProjectDir));
    if (!existsSync(testProjectTmpDir)) {
      mkdirSync(testProjectTmpDir, { recursive: true });
      await createTestReactProjectDir(testProjectTmpDir);
    }

    testProjectDirPackages = await createTestPackagesDir(testProjectDir);
    packagePath = resolve(testProjectDirPackages, packageToTest);
  }, 200000);

  afterAll(() => removeTestProjectDir(__filename));

  describe("Simple project", () => {
    let testSimpleProjectDir: string;

    beforeEach(async () => {
      testSimpleProjectDir = join(testProjectDir, "simple-project");
      await safeExec(testProjectDir, `cp -r ${testProjectTmpDir} ${testSimpleProjectDir}`);
    }, 200000);

    afterEach(() => deleteFolderRecursive(testSimpleProjectDir));

    it(`Installs ${packageToTest} package`, async () => {
      const {
        code: installPackageCode,
        // stderr: installPackageStderr
      } = await exec(testSimpleProjectDir, `yarn add --dev "file:${packagePath}"`);
      await safeExec(testSimpleProjectDir, `yarn install`);

      // FIXME: installation ouput warnings due to create-react-app
      // expect(installPackageStderr).toBeFalsy();
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

      await createTestMonorepoProjectDir(testMonorepoProjectDir, async (projectDir) => {
        await safeExec(testMonorepoProjectDir, `cp -r ${testProjectTmpDir} ${projectDir}`);
        await safeExec(projectDir, `yarn install`);
      });
    }, 200000);

    afterEach(() => deleteFolderRecursive(testMonorepoProjectDir));

    it(`Installs ${packageToTest} package`, async () => {
      const {
        code: installPackageCode,
        // stderr: installPackageStderr
      } = await exec(testMonorepoProjectDir, `yarn add -W --dev "file:${packagePath}"`);

      // FIXME: installation ouput warnings due to create-react-app
      // expect(installPackageStderr).toBeFalsy();
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
