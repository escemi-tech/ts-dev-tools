import { readdirSync, lstatSync } from "fs";
import { resolve } from "path";
import { PackageJson } from "../services/PackageJson";
import { PluginService } from "../services/PluginService";
import { createProjectForTestFile } from "./test-project";
import { copyFolder } from "./file-system";

async function createTestPackagesProject(projectDir: string): Promise<void> {
  const originalPackagesPath = resolve(__dirname, "../../../..");

  await copyFolder(originalPackagesPath, projectDir);

  const projectDirPackages = resolve(projectDir, "packages");

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
}

/**
 * Create a full file structure for testing ts-dev-tools packages installation
 * @param projectDir path where to prepare packages
 * @returns packages directory path
 */

export async function createTestPackagesDir(filename: string, useCache = true): Promise<string> {
  const testPackagesFileName = filename.replace(".spec.ts", `-test-packages.spec.ts`);
  return createProjectForTestFile(testPackagesFileName, useCache, createTestPackagesProject);
}
