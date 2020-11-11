import { readdirSync, unlinkSync } from "fs";
import { resolve } from "path";

import {
  backupPackageJson,
  getInstalledPlugins,
  revertPackageJson,
  updatePackageJson,
} from "../services/packageJson";

export type Migration = { name: string; path: string };

export function getAvailableMigrations(
  tsDevToolsRootPath: string,
  absoluteProjectDir: string,
  currentVersion: string | undefined
): Migration[] {
  const installedPlugins = getInstalledPlugins(absoluteProjectDir);

  const installedPluginsMigrations = installedPlugins.map((plugin) =>
    resolve(tsDevToolsRootPath, "../../", plugin, "dist/install/migrations")
  );

  const migrationDirs = [resolve(__dirname, "./migrations"), ...installedPluginsMigrations];

  const migrationFiles: Migration[] = [];
  for (const migrationDir of migrationDirs) {
    for (const migrationFile of readdirSync(migrationDir)) {
      if (!migrationFile.match(/^[0-9]{14}-[a-z]+\.(js|ts)$/)) {
        continue;
      }

      const migrationName = migrationFile.split(".").slice(0, -1).join(".");
      const shouldApplyMigration =
        !currentVersion || currentVersion.localeCompare(migrationName) < 0;

      if (!shouldApplyMigration) {
        continue;
      }

      migrationFiles.push({ name: migrationName, path: resolve(migrationDir, migrationFile) });
    }
  }

  migrationFiles.sort(({ name: nameA }, { name: nameB }) => nameA.localeCompare(nameB));

  return migrationFiles;
}

export function executeMigrations(migrations: Migration[], absoluteProjectDir: string): void {
  const packageJsonBackupPath = backupPackageJson(absoluteProjectDir);

  try {
    for (const migration of migrations) {
      console.info(`Apply migration "${migration.name}"`);

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { up } = require(migration.path);

      // Apply migration
      up(absoluteProjectDir);

      // Upgrade current version
      updatePackageJson(absoluteProjectDir, { tsDevTools: { version: migration.name } });
    }
  } catch (error) {
    // Rollback package.json
    revertPackageJson(absoluteProjectDir, packageJsonBackupPath);
    throw error;
  }

  unlinkSync(packageJsonBackupPath);
}
