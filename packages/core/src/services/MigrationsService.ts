import { readdirSync, unlinkSync } from "fs";
import { resolve } from "path";

import { PackageJson } from "../services/PackageJson";

export type Migration = { name: string; path: string };

export type MigrationUpFunction = (absoluteProjectDir: string) => Promise<void>;

export class MigrationsService {
  static async executeMigrations(
    tsDevToolsRootPath: string,
    absoluteProjectDir: string,
    currentVersion: string | undefined
  ): Promise<void> {
    const migrations = MigrationsService.getAvailableMigrations(
      tsDevToolsRootPath,
      absoluteProjectDir,
      currentVersion
    );

    const packageJson = PackageJson.fromDirPath(absoluteProjectDir);
    const packageJsonBackupPath = packageJson.backup();

    try {
      for (const migration of migrations) {
        console.info(`Applying migration "${migration.name}"...`);

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { up } = require(migration.path);

        // Apply migration
        await up(absoluteProjectDir);

        // Upgrade current version
        PackageJson.fromDirPath(absoluteProjectDir).merge({
          tsDevTools: { version: migration.name },
        });

        console.info(`Migration "${migration.name}" applied!`);
      }
    } catch (error) {
      // Rollback package.json
      packageJson.restore(packageJsonBackupPath);
      throw error;
    }

    unlinkSync(packageJsonBackupPath);
  }

  private static getAvailableMigrations(
    tsDevToolsRootPath: string,
    absoluteProjectDir: string,
    currentVersion: string | undefined
  ): Migration[] {
    const packageJson = PackageJson.fromDirPath(absoluteProjectDir);
    const installedPlugins = packageJson.getInstalledPlugins();

    const migrationFiles: Migration[] = [];
    for (const installedPlugin of installedPlugins) {
      migrationFiles.push(
        ...MigrationsService.getPluginMigrations(
          tsDevToolsRootPath,
          installedPlugin,
          currentVersion
        )
      );
    }

    migrationFiles.sort(({ name: nameA }, { name: nameB }) => nameA.localeCompare(nameB));

    return Array.from(new Set(migrationFiles));
  }

  private static getPluginMigrations(
    tsDevToolsRootPath: string,
    plugin: string,
    currentVersion: string | undefined
  ): Migration[] {
    const pluginDirPath = resolve(tsDevToolsRootPath, "../../", plugin);

    // First retrieve migration of inherited plugins
    const migrationFiles = MigrationsService.getAvailableMigrations(
      tsDevToolsRootPath,
      pluginDirPath,
      currentVersion
    );

    // Then retrieve
    const pluginMigrationsDirPath = resolve(pluginDirPath, "dist/install/migrations");
    for (const migrationFile of readdirSync(pluginMigrationsDirPath)) {
      if (!migrationFile.match(/^[0-9]{14}-[a-z]+\.(js|ts)$/)) {
        continue;
      }

      const migrationName = migrationFile.split(".").slice(0, -1).join(".");
      const shouldApplyMigration =
        !currentVersion || currentVersion.localeCompare(migrationName) < 0;

      if (!shouldApplyMigration) {
        continue;
      }

      migrationFiles.push({
        name: migrationName,
        path: resolve(pluginMigrationsDirPath, migrationFile),
      });
    }
    return migrationFiles;
  }
}
