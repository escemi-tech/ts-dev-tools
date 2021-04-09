import { resolve } from "path";

import { DuplicateDependenciesService } from "../services/DuplicateDependenciesService";
import { MigrationsService } from "../services/MigrationsService";
import { PackageJson } from "../services/PackageJson";

export async function install({ cwd, dir = "." }: { cwd: string; dir: string }): Promise<void> {
  const tsDevToolsRootPath = resolve(__dirname, "../..");

  const packageName = PackageJson.fromDirPath(tsDevToolsRootPath).getPackageName();

  // Ensure that we're not trying to install outside cwd
  const absoluteProjectDir = resolve(cwd, dir);
  if (!absoluteProjectDir.startsWith(cwd)) {
    throw new Error(".. not allowed");
  }

  // Run installation migration
  const currentVersion = PackageJson.fromDirPath(absoluteProjectDir).getTsDevToolsVersion();

  if (currentVersion) {
    console.info(`Updating ${packageName} installation...`);
  } else {
    console.info(`Installing ${packageName}...`);
  }

  await MigrationsService.executeMigrations(tsDevToolsRootPath, absoluteProjectDir, currentVersion);

  DuplicateDependenciesService.duplicateDependencies(tsDevToolsRootPath, absoluteProjectDir);

  console.info(`Installation done!`);
}
