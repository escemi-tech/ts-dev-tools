import { copyFileSync, existsSync, lstatSync, mkdirSync, readdirSync, symlinkSync } from "fs";
import { join, resolve } from "path";

import { PackageJson } from "../services/PackageJson";
import { PluginService } from "../services/PluginService";
import { safeExec } from "./cli";
import { createTestDir, getTestDirPath, removeTestDir } from "./test-dir";

export const testProjectDir = resolve("__tests__/test-project");
const defaultPackageJsonPath = join(testProjectDir, "package.json");
const getTestProjectDirPath = (filename: string) => getTestDirPath("test", filename);

export function createTestProjectDir(filename: string): string {
  const testDirPath = getTestProjectDirPath(filename);
  return createTestDir(testDirPath, true);
}

export function createTestProjectDirWithFixtures(filename: string) {
  const testProjectDirPath = createTestProjectDir(filename);
  mkdirSync(join(testProjectDirPath, ".git/hooks"), { recursive: true });

  // Fake node_modules
  const corePackageRootPath = getCorePackageRootPath(filename);
  mkdirSync(corePackageRootPath, { recursive: true });
  copyFileSync(resolve(__dirname, "../../package.json"), join(corePackageRootPath, "package.json"));

  // Fake migrations
  const tsDevToolsDistPath = join(corePackageRootPath, "dist");
  symlinkSync(resolve(__dirname, ".."), tsDevToolsDistPath);

  restorePackageJson(filename);

  return testProjectDirPath;
}

export function getCorePackageRootPath(filename: string): string {
  const testProjectDirPath = getTestProjectDirPath(filename);
  if (!existsSync(testProjectDirPath)) {
    throw new Error(`Test project dir "${testProjectDirPath}" does not exist`);
  }

  return join(testProjectDirPath, "node_modules/@ts-dev-tools/core");
}

export function restorePackageJson(filename: string): void {
  const testProjectDirPath = getTestProjectDirPath(filename);
  if (!existsSync(testProjectDirPath)) {
    throw new Error(`Test project dir "${testProjectDirPath}" does not exist`);
  }
  copyFileSync(defaultPackageJsonPath, join(testProjectDirPath, "package.json"));
}

export function removeTestProjectDir(filename: string): void {
  const testProjectDirPath = getTestProjectDirPath(filename);
  removeTestDir(testProjectDirPath);
}

export const createTestMonorepoProjectDir = async (
  projectDir: string,
  createProject: (projectDir: string) => Promise<void>
) => {
  await safeExec(projectDir, "yarn init --yes");
  await safeExec(projectDir, "yarn install");
  await safeExec(projectDir, "yarn add -W --dev typescript");
  await safeExec(projectDir, "yarn tsc --init");

  PackageJson.fromDirPath(projectDir).merge({
    private: true,
    workspaces: ["packages/*"],
  });

  const packageDir = join(projectDir, "packages/test-package");
  mkdirSync(packageDir, { recursive: true });
  await createProject(packageDir);
};

/**
 * Create a full file structure for testing ts-dev-tools packages installation
 * @param projectDir path where to prepare packages
 * @returns packages directory path
 */
export const createTestPackagesDir = async (projectDir: string): Promise<string> => {
  const originalPackagesPath = resolve(__dirname, "../../..");

  let projectDirPackages = join(projectDir, "tmp-packages");
  mkdirSync(projectDirPackages);

  await safeExec(projectDir, `cp -R ${originalPackagesPath} ${projectDirPackages}/`);

  projectDirPackages = resolve(projectDirPackages, "packages");

  const projectDirPackagesFiles = readdirSync(projectDirPackages);
  for (const projectDirPackagesFile of projectDirPackagesFiles) {
    const packagePath = resolve(projectDirPackages, projectDirPackagesFile);
    if (!lstatSync(packagePath).isDirectory()) {
      continue;
    }

    const packageJson = PackageJson.fromDirPath(packagePath);
    const content = packageJson.getContent();
    if (content.dependencies) {
      for (const packageName of Object.keys(content.dependencies)) {
        if (PluginService.packageNameIsPlugin(packageName)) {
          content.dependencies[packageName] = `file:../${PluginService.getPluginShortname(
            packageName
          )}`;
        }
      }
      packageJson.setContent(content);
    }
  }

  return projectDirPackages;
};
