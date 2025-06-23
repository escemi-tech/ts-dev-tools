import { MigrationUpFunction } from "../../services/MigrationsService";
import { PackageJson } from "../../services/PackageJson";

export const up: MigrationUpFunction = async (absoluteProjectDir: string): Promise<void> => {
  const prettierConfig = {
    plugins: ["@prettier/plugin-oxc"],
  };

  const packageJson = PackageJson.fromDirPath(absoluteProjectDir);
  packageJson.merge({
    prettier: prettierConfig,
  });
};
