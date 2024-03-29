import { MigrationUpFunction } from "../../services/MigrationsService";
import { PackageJson } from "../../services/PackageJson";

export const up: MigrationUpFunction = async (absoluteProjectDir: string): Promise<void> => {
  const eslintConfig = {
    ignorePatterns: ["dist", "node_modules"],
  };

  const packageJson = PackageJson.fromDirPath(absoluteProjectDir);
  packageJson.merge({
    eslintConfig,
  });
};
