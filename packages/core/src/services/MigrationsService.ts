import { readdirSync, unlinkSync } from "fs";
import { resolve } from "path";

import { PackageJson } from "../services/PackageJson";
import { Plugin, PluginService } from "./PluginService";

export type Migration = { fullname: string; shortname: string; path: string };

export type MigrationUpFunction = (absoluteProjectDir: string) => Promise<void>;

export class MigrationsService {
  static MIGRATION_BUILT_PATH = "dist/install/migrations";

  static async executeMigrations(
    absoluteProjectDir: string,
    currentVersion: string | undefined
  ): Promise<void> {
    const migrations = MigrationsService.getAvailableMigrations(absoluteProjectDir, currentVersion);

    const packageJson = PackageJson.fromDirPath(absoluteProjectDir);
    const packageJsonBackupPath = packageJson.backup();

    try {
      for (const migration of migrations) {
        console.info(`Applying migration "${migration.fullname}"...`);

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { up } = require(migration.path);

        // Apply migration
        await up(absoluteProjectDir);

        // Upgrade current version
        PackageJson.fromDirPath(absoluteProjectDir).merge({
          tsDevTools: { version: migration.shortname },
        });

        console.info(`Migration "${migration.fullname}" applied!`);
      }
    } catch (error) {
      // Rollback package.json
      packageJson.restore(packageJsonBackupPath);
      throw error;
    }

    unlinkSync(packageJsonBackupPath);
  }

  private static getAvailableMigrations(
    absoluteProjectDir: string,
    currentVersion: string | undefined
  ): Migration[] {
    const installedPlugins = PluginService.getInstalledPlugins(absoluteProjectDir);

    const migrationFiles: Migration[] = [];
    for (const installedPlugin of installedPlugins) {
      migrationFiles.push(
        ...MigrationsService.getPluginMigrations(installedPlugin, currentVersion)
      );
    }

    migrationFiles.sort(({ shortname: nameA }, { shortname: nameB }) => nameA.localeCompare(nameB));

    return Array.from(new Set(migrationFiles));
  }

  private static getPluginMigrations(
    plugin: Plugin,
    currentVersion: string | undefined
  ): Migration[] {
    const migrationFiles = [];

    const pluginMigrationsDirPath = resolve(plugin.path, MigrationsService.MIGRATION_BUILT_PATH);
    for (const migrationFile of readdirSync(pluginMigrationsDirPath)) {
      if (!migrationFile.match(/^[0-9]{14}-[-a-z]+\.(js|ts)$/)) {
        continue;
      }

      const migrationName = MigrationsService.getMigrationNameFromFile(migrationFile);
      const shouldApplyMigration = MigrationsService.migrationIsAfterCurrentVersion(
        migrationName,
        currentVersion
      );

      if (!shouldApplyMigration) {
        continue;
      }

      migrationFiles.push({
        shortname: migrationName,
        fullname: `${plugin.shortname} - ${migrationName}`,
        path: resolve(pluginMigrationsDirPath, migrationFile),
      });
    }
    return migrationFiles;
  }

  public static getMigrationNameFromFile(migrationFile: string): string {
    const migrationName = migrationFile.split(".").slice(0, -1).join(".");
    return migrationName;
  }

  public static migrationIsAfterCurrentVersion(migrationName: string, currentVersion?: string) {
    return !currentVersion || currentVersion.localeCompare(migrationName) < 0;
  }
}
