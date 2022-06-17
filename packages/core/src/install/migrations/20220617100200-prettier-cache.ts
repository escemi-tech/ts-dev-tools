import { MigrationUpFunction } from "../../services/MigrationsService";
import { PackageJson } from "../../services/PackageJson";

export const up: MigrationUpFunction = async (absoluteProjectDir: string): Promise<void> => {
  const scripts = {
    format: "prettier --cache --write '**/*.ts'",
  };

  const packageJson = PackageJson.fromDirPath(absoluteProjectDir);
  packageJson.merge({
    scripts,
  });
};
