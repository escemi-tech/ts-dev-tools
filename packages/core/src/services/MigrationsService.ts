import { existsSync, readdirSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { PackageJson } from "../services/PackageJson";
import {
  type AppliedManagedGitHook,
  HooksService,
  type ManagedGitHook,
} from "./HooksService";
import { type Plugin, PluginService } from "./PluginService";

export type Migration = { fullname: string; shortname: string; path: string };

export type MigrationUpFunction = (absoluteProjectDir: string) => Promise<void>;

type MigrationModule = {
  hooks?: ManagedGitHook[];
  up: MigrationUpFunction;
};

export class MigrationsService {
  private constructor() {}

  static MIGRATION_BUILT_PATH = "dist/install/migrations";

  static async executeMigrations(
    absoluteProjectDir: string,
    currentVersion: string | undefined,
  ): Promise<void> {
    const migrations = MigrationsService.getMigrations(absoluteProjectDir);

    const packageJson = PackageJson.fromDirPath(absoluteProjectDir);
    const packageJsonBackupPath = packageJson.backup();
    const consolidatedManagedGitHooks = new Map<
      string,
      AppliedManagedGitHook
    >();

    try {
      for (const migration of migrations) {
        const migrationModule = (await import(
          migration.path
        )) as MigrationModule;

        HooksService.consolidateManagedGitHooks(
          absoluteProjectDir,
          migrationModule.hooks ?? [],
          consolidatedManagedGitHooks,
        );

        const shouldApplyMigration =
          MigrationsService.migrationIsAfterCurrentVersion(
            migration.shortname,
            currentVersion,
          );

        if (!shouldApplyMigration) {
          continue;
        }

        console.info(`Applying migration "${migration.fullname}"...`);

        // Apply migration
        await migrationModule.up(absoluteProjectDir);

        // Upgrade current version
        PackageJson.fromDirPath(absoluteProjectDir).merge({
          tsDevTools: { version: migration.shortname },
        });

        console.info(`Migration "${migration.fullname}" applied!`);
      }

      await HooksService.applyManagedGitHooks(
        absoluteProjectDir,
        Array.from(consolidatedManagedGitHooks.values()),
      );
    } catch (error) {
      // Rollback package.json
      packageJson.restore(packageJsonBackupPath);
      throw error;
    }

    if (existsSync(packageJsonBackupPath)) {
      unlinkSync(packageJsonBackupPath);
    }
  }

  private static getMigrations(absoluteProjectDir: string): Migration[] {
    const installedPlugins =
      PluginService.getInstalledPlugins(absoluteProjectDir);

    const migrationFiles: Migration[] = [];
    for (const installedPlugin of installedPlugins) {
      migrationFiles.push(
        ...MigrationsService.getPluginMigrations(installedPlugin),
      );
    }

    migrationFiles.sort(({ shortname: nameA }, { shortname: nameB }) =>
      nameA.localeCompare(nameB),
    );

    return Array.from(new Set(migrationFiles));
  }

  private static getPluginMigrations(plugin: Plugin): Migration[] {
    const migrationFiles = [];

    const pluginMigrationsDirPath = resolve(
      plugin.path,
      MigrationsService.MIGRATION_BUILT_PATH,
    );
    for (const migrationFile of readdirSync(pluginMigrationsDirPath)) {
      if (!migrationFile.match(/^[0-9]{14}-[-a-z]+\.(js|ts)$/)) {
        continue;
      }

      const migrationName =
        MigrationsService.getMigrationNameFromFile(migrationFile);

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

  public static migrationIsAfterCurrentVersion(
    migrationName: string,
    currentVersion?: string,
  ) {
    return !currentVersion || currentVersion.localeCompare(migrationName) < 0;
  }
}
