import { existsSync } from "fs";
import { join, resolve } from "path";

import { CorePackageService } from "../services/CorePackageService";
import { DuplicateDependenciesService } from "../services/DuplicateDependenciesService";
import { MigrationsService } from "../services/MigrationsService";
import { PackageJson } from "../services/PackageJson";

export async function install({ cwd, dir = "." }: { cwd: string; dir: string }): Promise<void> {
  const packageName = CorePackageService.getPackageName();

  // Ensure that we're not trying to install outside cwd
  const absoluteProjectDir = resolve(cwd, dir);

  if (!existsSync(absoluteProjectDir)) {
    throw new Error(`Unable to install ${packageName} in given directory ${join(cwd, dir)}`);
  }

  if (!absoluteProjectDir.startsWith(cwd)) {
    throw new Error(`Unable to install ${packageName} in a different folder than current process`);
  }

  // Run installation migration
  const currentVersion = PackageJson.fromDirPath(absoluteProjectDir).getTsDevToolsVersion();

  if (currentVersion) {
    console.info(`Updating ${packageName} installation...`);
  } else {
    console.info(`Installing ${packageName}...`);
  }

  await MigrationsService.executeMigrations(absoluteProjectDir, currentVersion);

  DuplicateDependenciesService.duplicateDependencies(absoluteProjectDir);

  console.info(`Installation done!`);
}
