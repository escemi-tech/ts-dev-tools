import { join } from "node:path";

import { FileService } from "../../services/FileService";
import type { MigrationUpFunction } from "../../services/MigrationsService";
import { PackageJson } from "../../services/PackageJson";
import { PackageManagerService } from "../../services/PackageManagerService";

export const VITEST_CONFIG_FILE_NAME = "vitest.config.ts";

export const MANAGED_CORE_VITEST_CONFIG = `import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.{ts,tsx,js,jsx}"],
      provider: "v8",
    },
    environment: "node",
    globals: true,
  },
});
`;

export const up: MigrationUpFunction = async (
  absoluteProjectDir: string,
): Promise<void> => {
  const packageManager =
    PackageManagerService.detectPackageManager(absoluteProjectDir);

  const packageJson = PackageJson.fromDirPath(absoluteProjectDir);
  const packageJsonContent = packageJson.getContent();

  delete packageJsonContent.jest;

  const scripts = {
    ...(packageJsonContent.scripts as Record<string, string> | undefined),
    test: "vitest run",
    "test:ci": `${packageManager} run test:cov`,
    "test:cov": "vitest run --coverage",
    "test:watch": "vitest",
    vitest: "vitest",
  } as Record<string, string>;
  delete scripts.jest;

  packageJsonContent.scripts = scripts;
  packageJson.setContent(packageJsonContent);

  putManagedVitestConfig(absoluteProjectDir, MANAGED_CORE_VITEST_CONFIG);
};

function putManagedVitestConfig(
  absoluteProjectDir: string,
  managedContent: string,
): void {
  const vitestConfigFilePath = join(
    absoluteProjectDir,
    VITEST_CONFIG_FILE_NAME,
  );

  if (FileService.fileExists(vitestConfigFilePath)) {
    return;
  }

  FileService.putFileContent(vitestConfigFilePath, managedContent);
}
