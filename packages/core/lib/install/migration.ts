import { readdirSync } from "fs";
import { join } from "path";

export function executeMigrations(absoluteProjectDir: string, currentVersion: string | undefined) {
  const migrationDir = join(__dirname, "./migrations");
  const migrationFiles = readdirSync(migrationDir).filter((migrationFile) =>
    migrationFile.match(/^[0-9]{16}-[a-z]+.ts$/)
  );
  migrationFiles.sort();

  for (const key in migrationFiles) {
    const migrationFile = migrationFiles[key];
    const migrationName = migrationFile.split(".").slice(0, -1).join(".");

    if (currentVersion && currentVersion.localeCompare(migrationName) > 0) {
      continue;
    }

    const migrationFilePath = join(migrationDir, migrationFiles[key]);
    const up = require(migrationFilePath).Up;
    up(absoluteProjectDir);
  }
}
