import { existsSync } from "fs";
import { join, resolve } from "path";

import { readPackageJson } from "../services/packageJson";
import { executeMigrations } from "./migration";

export function install({ cwd, dir = "." }: { cwd: string; dir: string }): void {
  // Ensure that we're not trying to install outside cwd
  const absoluteProjectDir = resolve(cwd, dir);
  if (!absoluteProjectDir.startsWith(cwd)) {
    throw new Error(".. not allowed");
  }

  // Ensure that cwd is git top level
  const gitDirPath = join(cwd, ".git");
  if (!existsSync(gitDirPath)) {
    throw new Error(`${gitDirPath} can't be found`);
  }

  // Run installation migration
  const packageJson = readPackageJson(absoluteProjectDir);
  const currentVersion = packageJson.jsDevTools?.version;

  executeMigrations(absoluteProjectDir, currentVersion);
}
