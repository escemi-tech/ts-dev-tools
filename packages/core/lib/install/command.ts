import { resolve } from "path";

import { readPackageJson } from "../services/packageJson";
import { executeMigrations, getAvailableMigrations } from "./migration";

export function install({ cwd, dir = "." }: { cwd: string; dir: string }): void {
  const tsDevToolsRootPath = resolve(__dirname, "../..");
  const packageName = readPackageJson(tsDevToolsRootPath).name;

  // Ensure that we're not trying to install outside cwd
  const absoluteProjectDir = resolve(cwd, dir);
  if (!absoluteProjectDir.startsWith(cwd)) {
    throw new Error(".. not allowed");
  }

  // Run installation migration
  const packageJson = readPackageJson(absoluteProjectDir);
  const currentVersion = packageJson.tsDevTools?.version;

  if (currentVersion) {
    console.info(`Updating ${packageName} installation...`);
  } else {
    console.info(`Installing ${packageName}...`);
  }

  const migrations = getAvailableMigrations(tsDevToolsRootPath, absoluteProjectDir, currentVersion);

  executeMigrations(migrations, absoluteProjectDir);

  console.info(`Installation done!`);
}
