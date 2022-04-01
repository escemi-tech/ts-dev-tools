import { mkdirSync } from "fs";
import { join, resolve } from "path";

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
      await createTestReactProjectDir(testSimpleProjectDir);
    }, 200000);

    afterEach(() => deleteFolderRecursive(testSimpleProjectDir));

    it(`Installs ${packageToTest} package`, async () => {
      const {
        code: installPackageCode,
        // stderr: installPackageStderr
      } = await exec(testSimpleProjectDir, `yarn add --dev "file:${packagePath}"`);

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

      const {
        code: lintCode,
        // stderr: lintStderr
      } = await exec(testSimpleProjectDir, "yarn lint");

      // FIXME: eslint fails to check installed react package
      // expect(lintStderr).toBeFalsy();
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

      await createTestMonorepoProjectDir(testMonorepoProjectDir, createTestReactProjectDir);
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
