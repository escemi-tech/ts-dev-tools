import { join, resolve } from "path";

import { readPackageJson } from "../services/packageJson";
import { executeMigrations } from "./migration";

export function install({ cwd, dir = "." }: { cwd: string; dir: string }): void {
  const packageName = readPackageJson(join(__dirname, "../..")).name;

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

  executeMigrations(absoluteProjectDir, currentVersion);

  console.info(`Installation done!`);
}
