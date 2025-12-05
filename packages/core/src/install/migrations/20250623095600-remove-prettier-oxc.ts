import { MigrationUpFunction } from "../../services/MigrationsService";
import { JsonFileData, PackageJson } from "../../services/PackageJson";

export const up: MigrationUpFunction = async (absoluteProjectDir: string): Promise<void> => {
  const packageJson = PackageJson.fromDirPath(absoluteProjectDir);

  const packageJsonContent = packageJson.getContent();
  
  // Remove @prettier/plugin-oxc from prettier.plugins if it exists
  if (packageJsonContent.prettier && typeof packageJsonContent.prettier === "object") {
    const prettierConfig = packageJsonContent.prettier as JsonFileData;
    if (Array.isArray(prettierConfig.plugins)) {
      const plugins = prettierConfig.plugins as string[];
      const filteredPlugins = plugins.filter((plugin) => plugin !== "@prettier/plugin-oxc");
      
      if (filteredPlugins.length !== plugins.length) {
        prettierConfig.plugins = filteredPlugins;
        packageJson.setContent(packageJsonContent);
      }
    }
  }
};
