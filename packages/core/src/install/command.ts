import { resolve } from "path";

import { PackageJson } from "../services/PackageJson";
import { MigrationsService } from "./MigrationsService";

export function install({ cwd, dir = "." }: { cwd: string; dir: string }): void {
  const tsDevToolsRootPath = resolve(__dirname, "../..");
  const packageJson = PackageJson.fromDirPath(tsDevToolsRootPath);
  const packageName = packageJson.getPackageName();

  // Ensure that we're not trying to install outside cwd
  const absoluteProjectDir = resolve(cwd, dir);
  if (!absoluteProjectDir.startsWith(cwd)) {
    throw new Error(".. not allowed");
  }

  // Run installation migration
  const currentVersion = packageJson.getTsDevToolsVersion();

  if (currentVersion) {
    console.info(`Updating ${packageName} installation...`);
  } else {
    console.info(`Installing ${packageName}...`);
  }

  const migrations = MigrationsService.getAvailableMigrations(
    tsDevToolsRootPath,
    absoluteProjectDir,
    currentVersion
  );

  MigrationsService.executeMigrations(migrations, absoluteProjectDir);

  console.info(`Installation done!`);
}
