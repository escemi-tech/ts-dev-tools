import type { MigrationUpFunction } from "../../services/MigrationsService";
import { PackageJson } from "../../services/PackageJson";

export const up: MigrationUpFunction = async (
  absoluteProjectDir: string,
): Promise<void> => {
  const packageJson = PackageJson.fromDirPath(absoluteProjectDir);

  const packageJsonContent = packageJson.getContent();
  delete packageJsonContent.eslintConfig;
  packageJson.setContent(packageJsonContent);
};
