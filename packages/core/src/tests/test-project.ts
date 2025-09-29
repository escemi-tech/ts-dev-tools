import { copyFileSync, symlinkSync } from "fs";
import { join, resolve, relative } from "path";

import { getTestCacheDirPath, testCacheDirExists } from "./test-cache";
import { copyFolder, recreateFolderRecursive, deleteFolderRecursive } from "./file-system";
import { tmpdir } from "os";

const rootDirPath = resolve(__dirname, "../../../..");
const corePackageDirPath = resolve(__dirname, "..", "..");
const testProjectDir = resolve("__tests__/test-project");
const defaultPackageJsonPath = join(testProjectDir, "package.json");
const defaultPackageJsonLockPath = join(testProjectDir, "package-lock.json");

export const getPackageNameFromFilepath = (filepath: string): string => {
  const relativeFilepath = relative(rootDirPath, filepath);

  const parts = relativeFilepath.split("/");
  if (parts.length < 2) {
    throw new Error("Invalid filepath: " + filepath);
  }
  const packageName = parts[1];

  if (!packageName) {
    throw new Error("Package name could not be determined from the filepath: " + filepath);
  }
  return packageName;
};

const getTestProjectDirPath = (filename: string) => {
  const testProjectRootDirPath = join(tmpdir(), "ts-dev-tools");
  const relativeFilepath = relative(rootDirPath, filename);

  const testProjectDirName = "test-" + relativeFilepath.toLowerCase().replace(/[^a-z0-9]/g, "-");

  return join(testProjectRootDirPath, testProjectDirName);
};

async function defaultProjectGenerator(testProjectDirPath: string): Promise<void> {
  // Fake node_modules
  const corePackageRootPath = join(testProjectDirPath, "node_modules/@ts-dev-tools/core");
  await recreateFolderRecursive(corePackageRootPath);
  copyFileSync(join(corePackageDirPath, "package.json"), join(corePackageRootPath, "package.json"));

  // Fake migrations
  const tsDevToolsDistPath = join(corePackageRootPath, "dist");
  symlinkSync(resolve(__dirname, ".."), tsDevToolsDistPath);

  copyFileSync(defaultPackageJsonPath, join(testProjectDirPath, "package.json"));
  copyFileSync(defaultPackageJsonLockPath, join(testProjectDirPath, "package-lock.json"));
}

export type TestProjectGenerator = (testProjectDir: string) => Promise<void>;

export async function createTestProject(
  packageName: string,
  testDirPath: string,
  useCache: boolean,
  testProjectGenerator: TestProjectGenerator = defaultProjectGenerator
): Promise<string> {
  await recreateFolderRecursive(testDirPath);

  const cacheName = testProjectGenerator.name;
  const testCacheDirPath = getTestCacheDirPath(packageName, cacheName);
  if (useCache && testCacheDirExists(packageName, cacheName)) {
    await copyFolder(testCacheDirPath, testDirPath);
    return testDirPath;
  }

  await testProjectGenerator(testDirPath);

  // Add mandatory project fixtures
  const gitHooksDirPath = join(testDirPath, ".git/hooks");
  await recreateFolderRecursive(gitHooksDirPath);

  if (useCache) {
    await copyFolder(testDirPath, testCacheDirPath);
  }

  return testDirPath;
}

export async function createProjectForTestFile(
  filepath: string,
  useCache: boolean,
  testProjectGenerator: TestProjectGenerator = defaultProjectGenerator
): Promise<string> {
  const testDirPath = getTestProjectDirPath(filepath);
  const packageName = getPackageNameFromFilepath(filepath);
  return createTestProject(packageName, testDirPath, useCache, testProjectGenerator);
}

export async function deleteTestProject(filepath: string): Promise<void> {
  const testProjectDirPath = getTestProjectDirPath(filepath);
  await deleteFolderRecursive(testProjectDirPath);
}
