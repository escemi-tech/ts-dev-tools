import { join } from "node:path";

import { FileService } from "../../services/FileService";
import { PackageJson } from "../../services/PackageJson";
import {
  createProjectForTestFile,
  deleteTestProject,
} from "../../tests/test-project";
import { up as init } from "./20201024173398-init";
import { up as migrateToBiome } from "./20260311120000-migrate-to-biome";
import { up } from "./20260604100000-migrate-to-vitest";

const useCache = true;
const shouldCleanupAfterTest = true;

describe("Migration 20260604100000-migrate-to-vitest", () => {
  let testProjectDir: string;

  beforeAll(() => {
    if (!useCache) {
      console.warn("Cache is disabled. Enable it one dev is done.");
    }
    if (!shouldCleanupAfterTest) {
      console.warn("Cleanup is disabled. Enable it one dev is done.");
    }
  });

  beforeEach(async () => {
    testProjectDir = await createProjectForTestFile(__filename, useCache);
  });

  afterEach(async () => {
    if (shouldCleanupAfterTest) {
      await deleteTestProject(__filename);
    }
  });

  it("should migrate generated Jest config and scripts to Vitest", async () => {
    await init(testProjectDir);
    await migrateToBiome(testProjectDir);
    await up(testProjectDir);

    const packageJsonContent =
      PackageJson.fromDirPath(testProjectDir).getContent();

    expect(packageJsonContent).toMatchSnapshot();
    expect(
      FileService.getFileContent(join(testProjectDir, "vitest.config.ts")),
    ).toMatchSnapshot();
  });

  it("should preserve an existing custom Vitest config", async () => {
    const vitestConfigFilePath = join(testProjectDir, "vitest.config.ts");
    const customVitestConfig = "export default {}\n";

    await init(testProjectDir);
    await migrateToBiome(testProjectDir);
    FileService.putFileContent(vitestConfigFilePath, customVitestConfig);

    await up(testProjectDir);

    expect(FileService.getFileContent(vitestConfigFilePath)).toBe(
      customVitestConfig,
    );
  });
});
