import { FileService } from "../../services/FileService";
import { MigrationUpFunction } from "../../services/MigrationsService";
import { PackageJson } from "../../services/PackageJson";

export const up: MigrationUpFunction = async (absoluteProjectDir: string): Promise<void> => {
  const packageJson = PackageJson.fromDirPath(absoluteProjectDir);

  const packageJsonContent = packageJson.getContent();
  delete packageJsonContent.eslintConfig;
  packageJson.setContent(packageJsonContent);

  const eslintConfigFilePath = `${absoluteProjectDir}/eslint.config.mjs`;
  if (FileService.fileExists(eslintConfigFilePath)) {
    return;
  }

  FileService.putFileContent(
    eslintConfigFilePath,
    `import tsDevToolsCore from "@ts-dev-tools/core/dist/eslint-plugin-ts-dev-tools/index.js";

export default tsDevToolsCore;
`
  );
};
