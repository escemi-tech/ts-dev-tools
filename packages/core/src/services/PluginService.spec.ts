import {
  createTestProjectDirWithFixtures,
  removeTestProjectDir,
  restorePackageJson,
} from "../tests/project";
import { PackageJson } from "./PackageJson";
import { PluginService } from "./PluginService";

describe("PluginService", () => {
  let testProjectDir: string;

  beforeAll(() => {
    testProjectDir = createTestProjectDirWithFixtures(__filename);
  });

  afterAll(() => {
    removeTestProjectDir(__filename);
  });

  describe("getInstalledPlugins", () => {
    afterEach(() => {
      restorePackageJson(__filename);
    });

    it("should return an empty array if no plugin is installed", () => {
      const installedPlugins = PluginService.getInstalledPlugins(testProjectDir);

      expect(installedPlugins).toEqual([]);
    });

    it("should return @ts-dev-tools/core when only @ts-dev-tools/core is installed", () => {
      const packageJson = PackageJson.fromDirPath(testProjectDir);
      packageJson.merge({
        devDependencies: {
          "@ts-dev-tools/core": "1.0.0",
        },
      });
      const installedPlugins = PluginService.getInstalledPlugins(testProjectDir);

      expect(installedPlugins).toHaveLength(1);
      expect(installedPlugins[0]).toMatchObject({
        fullname: "@ts-dev-tools/core",
        path: expect.stringContaining("/packages/core"),
        shortname: "core",
      });
    });

    it("should return @ts-dev-tools/react when @ts-dev-tools/react is installed", () => {
      const packageJson = PackageJson.fromDirPath(testProjectDir);
      packageJson.merge({
        devDependencies: {
          "@ts-dev-tools/react": "1.0.0",
        },
      });

      const installedPlugins = PluginService.getInstalledPlugins(testProjectDir);

      expect(installedPlugins).toHaveLength(2);
      expect(installedPlugins[0]).toMatchObject({
        fullname: "@ts-dev-tools/react",
        path: expect.stringContaining("/packages/react"),
        shortname: "react",
      });
      expect(installedPlugins[1]).toMatchObject({
        fullname: "@ts-dev-tools/core",
        path: expect.stringContaining("/packages/core"),
        shortname: "core",
      });
    });

    it("should return installed plugins sorted by name ascending", () => {
      const packageJson = PackageJson.fromDirPath(testProjectDir);
      packageJson.merge({
        devDependencies: {
          "@ts-dev-tools/react": "1.0.0",
          "@ts-dev-tools/core": "1.0.0",
        },
      });
      const installedPlugins = PluginService.getInstalledPlugins(testProjectDir);

      expect(installedPlugins).toHaveLength(2);
      expect(installedPlugins[0]).toMatchObject({
        fullname: "@ts-dev-tools/core",
        path: expect.stringContaining("/packages/core"),
        shortname: "core",
      });
      expect(installedPlugins[1]).toMatchObject({
        fullname: "@ts-dev-tools/react",
        path: expect.stringContaining("/packages/react"),
        shortname: "react",
      });
    });
  });
});
