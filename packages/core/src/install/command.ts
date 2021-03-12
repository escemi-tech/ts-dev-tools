import { resolve } from "path";

import { PackageJson } from "../services/PackageJson";
import { MigrationsService } from "./MigrationsService";

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

  const migrations = MigrationsService.getAvailableMigrations(
    tsDevToolsRootPath,
    absoluteProjectDir,
    currentVersion
  );

  await MigrationsService.executeMigrations(migrations, absoluteProjectDir);

  console.info(`Installation done!`);
}
