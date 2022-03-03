import { copyFileSync, existsSync, lstatSync, mkdirSync, readdirSync, symlinkSync } from "fs";
import { tmpdir } from "os";
import { basename, join, resolve } from "path";

import { PackageJson } from "../services/PackageJson";
import { PluginService } from "../services/PluginService";
import { safeExec } from "./cli";
import { deleteFolderRecursive } from "./file-system";

export const testProjectDir = resolve("__tests__/test-project");

const getTestProjectDirPath = (filename: string) =>
  join(tmpdir(), "test-" + basename(filename).split(".")[0]);

const defaultPackageJsonPath = join(testProjectDir, "package.json");

export function createTestProjectDir(filename: string): string {
  const testProjectDirPath = getTestProjectDirPath(filename);
  if (existsSync(testProjectDirPath)) {
    deleteFolderRecursive(testProjectDirPath);
  }

  mkdirSync(testProjectDirPath);
  return testProjectDirPath;
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
  if (!existsSync(testProjectDirPath)) {
    throw new Error(`Test project dir "${testProjectDirPath}" does not exist`);
  }
  deleteFolderRecursive(testProjectDirPath);
}

export const createTestMonorepoProjectDir = async (
  projectDir: string,
  createProject: (projectDir: string) => Promise<void>
) => {
  await safeExec(projectDir, "yarn init --yes");
  await safeExec(projectDir, "yarn add -W --dev typescript");
  await safeExec(projectDir, "yarn tsc --init");

  PackageJson.fromDirPath(projectDir).merge({
    private: true,
    workspaces: ["packages/*"],
  });

  const packageDir = join(projectDir, "packages/test-package");
  mkdirSync(packageDir, { recursive: true });
  await createProject(packageDir);

  await safeExec(projectDir, "yarn install");
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
