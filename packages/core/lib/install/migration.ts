import { copyFileSync, readdirSync, unlinkSync } from "fs";
import { join } from "path";

import { getPackageJsonPath, updatePackageJson } from "../services/packageJson";

export function executeMigrations(absoluteProjectDir: string, currentVersion: string | undefined) {
  const migrationDir = join(__dirname, "./migrations");
  const migrationFiles = readdirSync(migrationDir).filter((migrationFile) =>
    migrationFile.match(/^[0-9]{14}-[a-z]+\.(js|ts)$/)
  );
  migrationFiles.sort();

  // Backup package.json
  const packageJsonPath = getPackageJsonPath(absoluteProjectDir);
  const packageJsonBackupPath = packageJsonPath + ".backup";
  copyFileSync(packageJsonPath, packageJsonBackupPath);
  try {
    for (const key in migrationFiles) {
      const migrationFile = migrationFiles[key];
      const migrationName = migrationFile.split(".").slice(0, -1).join(".");

      const shouldApplyMigration =
        !currentVersion || currentVersion.localeCompare(migrationName) < 0;

      if (!shouldApplyMigration) {
        continue;
      }

      console.info(`Apply migration "${migrationName}"`);

      const migrationFilePath = join(migrationDir, migrationFiles[key]);
      const { up } = require(migrationFilePath);

      // Apply migration
      up(absoluteProjectDir);

      // Upgrade current version
      updatePackageJson(absoluteProjectDir, { tsDevTools: { version: migrationName } });
    }
  } catch (error) {
    // Rollback package.json
    copyFileSync(packageJsonBackupPath, packageJsonPath);
    throw error;
  }

  unlinkSync(packageJsonBackupPath);
}
