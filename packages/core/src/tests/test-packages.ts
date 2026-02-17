import { readdirSync, lstatSync } from "fs";
import { join, resolve } from "path";
import { PackageJson } from "../services/PackageJson";
import { PluginService } from "../services/PluginService";
import { createProjectForTestFile } from "./test-project";
import { copyFolder } from "./file-system";
import { safeExec } from "./cli";
import { getWorkspaceRootPath } from "./workspace-root";

async function createTestPackagesProject(projectDir: string): Promise<void> {
  const originalPackagesPath = resolve(getWorkspaceRootPath(), "packages");
  const projectDirPackages = resolve(projectDir, "packages");

  await copyFolder(originalPackagesPath, projectDirPackages);

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
          const pluginShortName = PluginService.getPluginShortname(packageName);
          const dependencyPath = resolve(join(packagePath, "..", pluginShortName));
          content.dependencies[packageName] = `file://${dependencyPath}`;
        }
      }
      packageJson.setContent(content);
    }
    await safeExec(packagePath, "npm install");
  }
}

/**
 * Create a full file structure for testing ts-dev-tools packages installation
 * This function is not using cache to prevents drift between current code and test code
 * @param projectDir path where to prepare packages
 * @returns packages directory path
 */

export async function createTestPackagesDir(filename: string): Promise<string> {
  const normalizedFilename = resolve(filename);
  const testPackagesFileName = normalizedFilename.replace(
    ".spec.ts",
    `-test-packages.spec.ts`
  );
  return createProjectForTestFile(testPackagesFileName, false, createTestPackagesProject);
}
