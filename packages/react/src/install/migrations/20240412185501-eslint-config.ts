import { MigrationUpFunction } from "@ts-dev-tools/core/dist/services/MigrationsService";
import { FileService } from "@ts-dev-tools/core/dist/services/FileService";

export const up: MigrationUpFunction = async (absoluteProjectDir: string): Promise<void> => {
  const eslintConfigFilePath = `${absoluteProjectDir}/eslint.config.mjs`;
  if (
    FileService.fileExists(eslintConfigFilePath) &&
    !FileService.getFileContent(eslintConfigFilePath).includes(
      `import tsDevToolsCore from "@ts-dev-tools/core/dist/eslint-plugin-ts-dev-tools";`
    )
  ) {
    return;
  }

  FileService.putFileContent(
    eslintConfigFilePath,
    `import tsDevToolsReact from "@ts-dev-tools/react/dist/eslint-plugin-ts-dev-tools";

export default [...tsDevToolsReact];
`
  );
};
