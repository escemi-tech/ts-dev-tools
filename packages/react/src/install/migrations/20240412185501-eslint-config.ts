import type { MigrationUpFunction } from "@ts-dev-tools/core/dist/services/MigrationsService";

export const up: MigrationUpFunction = async (
  _absoluteProjectDir: string,
): Promise<void> => {
  // No-op: React package migrated from ESLint config generation to Biome.
};
