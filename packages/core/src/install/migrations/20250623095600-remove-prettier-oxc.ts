import { MigrationUpFunction } from "../../services/MigrationsService";
import { JsonFileData, PackageJson } from "../../services/PackageJson";

export const up: MigrationUpFunction = async (absoluteProjectDir: string): Promise<void> => {
  const packageJson = PackageJson.fromDirPath(absoluteProjectDir);

  const packageJsonContent = packageJson.getContent();
  
  // Remove prettier.plugins if it exists
  if (packageJsonContent.prettier && typeof packageJsonContent.prettier === "object") {
    const prettierConfig = packageJsonContent.prettier as JsonFileData;
    if (prettierConfig.plugins) {
      delete prettierConfig.plugins;
      packageJson.setContent(packageJsonContent);
    }
  }
};
