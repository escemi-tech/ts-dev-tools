import { join } from "node:path";
import {
  MANAGED_CORE_VITEST_CONFIG,
  VITEST_CONFIG_FILE_NAME,
} from "@ts-dev-tools/core/dist/install/migrations/20260604100000-migrate-to-vitest";
import { FileService } from "@ts-dev-tools/core/dist/services/FileService";
import type { MigrationUpFunction } from "@ts-dev-tools/core/dist/services/MigrationsService";

const VITEST_SETUP_FILE_NAME = "vitest.setup.ts";

const MANAGED_REACT_VITEST_CONFIG = `import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.{ts,tsx,js,jsx}"],
      provider: "v8",
    },
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
`;

const MANAGED_REACT_VITEST_SETUP =
  'import "@testing-library/jest-dom/vitest";\n';

export const up: MigrationUpFunction = async (
  absoluteProjectDir: string,
): Promise<void> => {
  const vitestConfigFilePath = join(
    absoluteProjectDir,
    VITEST_CONFIG_FILE_NAME,
  );

  if (
    !FileService.fileExists(vitestConfigFilePath) ||
    FileService.getFileContent(vitestConfigFilePath) ===
      MANAGED_CORE_VITEST_CONFIG
  ) {
    FileService.putFileContent(
      vitestConfigFilePath,
      MANAGED_REACT_VITEST_CONFIG,
    );
  }

  const vitestSetupFilePath = join(absoluteProjectDir, VITEST_SETUP_FILE_NAME);

  if (!FileService.fileExists(vitestSetupFilePath)) {
    FileService.putFileContent(vitestSetupFilePath, MANAGED_REACT_VITEST_SETUP);
  }
};
