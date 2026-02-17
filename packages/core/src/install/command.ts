import { existsSync } from "fs";
import { join, resolve } from "path";

import { PROJECT_NAME } from "../constants";
import { DuplicateDependenciesService } from "../services/DuplicateDependenciesService";
import { MigrationsService } from "../services/MigrationsService";
import { PackageJson } from "../services/PackageJson";
import { PeerDependenciesService } from "../services/PeerDependenciesService";
import { SymlinkDependenciesService } from "../services/SymlinkDependenciesService";

export async function install({ cwd, dir = "." }: { cwd: string; dir: string }): Promise<void> {
  // Ensure that we're not trying to install outside cwd
  const absoluteProjectDir = resolve(cwd, dir);

  if (!existsSync(absoluteProjectDir)) {
    throw new Error(`Unable to install ${PROJECT_NAME} in given directory ${join(cwd, dir)}`);
  }

  if (!absoluteProjectDir.startsWith(cwd)) {
    throw new Error(`Unable to install ${PROJECT_NAME} in a different folder than current process`);
  }

  // Run installation migration
  const currentVersion = PackageJson.fromDirPath(absoluteProjectDir).getTsDevToolsVersion();

  if (currentVersion) {
    console.info(`Updating ${PROJECT_NAME} installation...`);
  } else {
    console.info(`Installing ${PROJECT_NAME}...`);
  }

  await MigrationsService.executeMigrations(absoluteProjectDir, currentVersion);

  await SymlinkDependenciesService.executeSymlinking(absoluteProjectDir);

  await PeerDependenciesService.executeResolution(absoluteProjectDir);

  DuplicateDependenciesService.executeDeduplication(absoluteProjectDir);

  console.info(`Installation done!`);
}
