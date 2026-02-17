import { lstatSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

import { getConsoleInfoContent, mockConsoleInfo, resetMockedConsoleInfo } from "../tests/console";
import { createProjectForTestFile, deleteTestProject } from "../tests/test-project";
import { PackageJson } from "./PackageJson";
import { PeerDependenciesService } from "./PeerDependenciesService";
import { PluginService } from "./PluginService";

// Set to false to avoid using the cache
const useCache = true;
// Set to false to inspect the test project directory after the test
const shouldCleanupAfterTest = true;

describe("PeerDependenciesService", () => {
  let testProjectDir: string;

  beforeAll(() => {
    if (!useCache) {
      console.warn("Cache is disabled. Enable it once dev is done.");
    }
    if (!shouldCleanupAfterTest) {
      console.warn("Cleanup is disabled. Enable it once dev is done.");
    }
  });

  beforeEach(async () => {
    testProjectDir = await createProjectForTestFile(__filename, useCache);
    mockConsoleInfo();
  });

  afterEach(async () => {
    resetMockedConsoleInfo();
    if (shouldCleanupAfterTest) {
      await deleteTestProject(__filename);
    }
  });

  describe("executeResolution", () => {
    it("should resolve peer dependencies and symlink missing ones", async () => {
      PackageJson.fromDirPath(testProjectDir).merge({
        devDependencies: {
          "@ts-dev-tools/core": "1.0.0",
        },
      });

      await PeerDependenciesService.executeResolution(testProjectDir);

      const consoleOutput = getConsoleInfoContent();
      expect(consoleOutput).toContain("Resolving peer dependencies...");
      expect(consoleOutput).toContain("Resolving peer dependencies done!");
    });

    it("should symlink missing peer dependency from plugin dependency", async () => {
      const pluginPath = join(testProjectDir, "node_modules", "@ts-dev-tools", "core");
      const getInstalledPluginsSpy = jest.spyOn(PluginService, "getInstalledPlugins").mockReturnValue([
        {
          fullname: "@ts-dev-tools/core",
          shortname: "core",
          path: pluginPath,
        },
      ]);

      PackageJson.fromDirPath(testProjectDir).merge({
        devDependencies: {
          "@ts-dev-tools/core": "1.0.0",
        },
      });

      const corePackageJson = PackageJson.fromDirPath(pluginPath);
      corePackageJson.merge({
        dependencies: {
          "fake-required": "1.0.0",
        },
      });

      const fakeRequiredPath = join(testProjectDir, "node_modules", "fake-required");
      const fakeRequiredNodeModulesPath = join(fakeRequiredPath, "node_modules");
      const fakePeerSourcePath = join(fakeRequiredNodeModulesPath, "fake-peer");

      mkdirSync(fakeRequiredPath, { recursive: true });
      writeFileSync(
        join(fakeRequiredPath, "package.json"),
        JSON.stringify(
          {
            name: "fake-required",
            version: "1.0.0",
            peerDependencies: {
              "fake-peer": "^1.0.0",
            },
          },
          null,
          2
        )
      );

      mkdirSync(fakePeerSourcePath, { recursive: true });
      writeFileSync(
        join(fakePeerSourcePath, "package.json"),
        JSON.stringify({ name: "fake-peer", version: "1.0.0" }, null, 2)
      );

      await PeerDependenciesService.executeResolution(testProjectDir);

      getInstalledPluginsSpy.mockRestore();

      const consoleOutput = getConsoleInfoContent();
      expect(consoleOutput).toContain(
        '- Symlinking peer dependency "fake-peer" required by "fake-required"'
      );
      expect(consoleOutput).toContain("Resolving peer dependencies done!");

      const fakePeerTargetPath = join(testProjectDir, "node_modules", "fake-peer");
      expect(lstatSync(fakePeerTargetPath).isSymbolicLink()).toBe(true);
    });

    it("should handle projects without plugins gracefully", async () => {
      await PeerDependenciesService.executeResolution(testProjectDir);

      const consoleOutput = getConsoleInfoContent();
      expect(consoleOutput).toContain("Resolving peer dependencies...");
      expect(consoleOutput).toContain("Resolving peer dependencies done!");
    });

    it("should warn when required peer dependency source cannot be resolved", async () => {
      const pluginPath = join(testProjectDir, "node_modules", "@ts-dev-tools", "core");
      const getInstalledPluginsSpy = jest.spyOn(PluginService, "getInstalledPlugins").mockReturnValue([
        {
          fullname: "@ts-dev-tools/core",
          shortname: "core",
          path: pluginPath,
        },
      ]);
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);

      const corePackageJson = PackageJson.fromDirPath(pluginPath);
      corePackageJson.merge({
        dependencies: {
          "fake-required": "1.0.0",
        },
      });

      const fakeRequiredPath = join(testProjectDir, "node_modules", "fake-required");
      mkdirSync(fakeRequiredPath, { recursive: true });
      writeFileSync(
        join(fakeRequiredPath, "package.json"),
        JSON.stringify(
          {
            name: "fake-required",
            version: "1.0.0",
            peerDependencies: {
              "missing-required-peer": "^1.0.0",
            },
          },
          null,
          2
        )
      );

      await PeerDependenciesService.executeResolution(testProjectDir);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '- Peer dependency "missing-required-peer" required by "fake-required" not found in plugin node_modules'
      );

      consoleWarnSpy.mockRestore();
      getInstalledPluginsSpy.mockRestore();
    });

    it("should skip missing optional peer dependencies without warnings", async () => {
      const pluginPath = join(testProjectDir, "node_modules", "@ts-dev-tools", "core");
      const getInstalledPluginsSpy = jest.spyOn(PluginService, "getInstalledPlugins").mockReturnValue([
        {
          fullname: "@ts-dev-tools/core",
          shortname: "core",
          path: pluginPath,
        },
      ]);
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);

      const corePackageJson = PackageJson.fromDirPath(pluginPath);
      corePackageJson.merge({
        dependencies: {
          "fake-optional-required": "1.0.0",
        },
      });

      const fakeRequiredPath = join(testProjectDir, "node_modules", "fake-optional-required");
      mkdirSync(fakeRequiredPath, { recursive: true });
      writeFileSync(
        join(fakeRequiredPath, "package.json"),
        JSON.stringify(
          {
            name: "fake-optional-required",
            version: "1.0.0",
            peerDependencies: {
              "missing-optional-peer": "^1.0.0",
            },
            peerDependenciesMeta: {
              "missing-optional-peer": {
                optional: true,
              },
            },
          },
          null,
          2
        )
      );

      await PeerDependenciesService.executeResolution(testProjectDir);

      const consoleOutput = getConsoleInfoContent();
      expect(consoleOutput).not.toContain('missing-optional-peer');
      expect(consoleWarnSpy).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
      getInstalledPluginsSpy.mockRestore();
    });

    it("should symlink scoped peers resolved from nested node_modules", async () => {
      const pluginPath = join(testProjectDir, "node_modules", "@ts-dev-tools", "core");
      const getInstalledPluginsSpy = jest.spyOn(PluginService, "getInstalledPlugins").mockReturnValue([
        {
          fullname: "@ts-dev-tools/core",
          shortname: "core",
          path: pluginPath,
        },
      ]);
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);

      const corePackageJson = PackageJson.fromDirPath(pluginPath);
      corePackageJson.merge({
        dependencies: {
          "fake-required": "1.0.0",
        },
      });

      const fakeRequiredPath = join(testProjectDir, "node_modules", "fake-required");
      const fakeCarrierPath = join(testProjectDir, "node_modules", "fake-carrier");
      const fakeScopedPeerPath = join(
        fakeCarrierPath,
        "node_modules",
        "@peer-scope",
        "fake-peer"
      );

      mkdirSync(fakeRequiredPath, { recursive: true });
      writeFileSync(
        join(fakeRequiredPath, "package.json"),
        JSON.stringify(
          {
            name: "fake-required",
            version: "1.0.0",
            peerDependencies: {
              "@peer-scope/fake-peer": "^1.0.0",
            },
          },
          null,
          2
        )
      );

      mkdirSync(fakeScopedPeerPath, { recursive: true });
      writeFileSync(
        join(fakeCarrierPath, "package.json"),
        JSON.stringify({ name: "fake-carrier", version: "1.0.0" }, null, 2)
      );
      writeFileSync(
        join(fakeScopedPeerPath, "package.json"),
        JSON.stringify({ name: "@peer-scope/fake-peer", version: "1.0.0" }, null, 2)
      );

      await PeerDependenciesService.executeResolution(testProjectDir);

      const consoleOutput = getConsoleInfoContent();
      expect(consoleOutput).toContain(
        '- Symlinking peer dependency "@peer-scope/fake-peer" required by "fake-required"'
      );
      expect(consoleWarnSpy).not.toHaveBeenCalled();

      const fakePeerTargetPath = join(testProjectDir, "node_modules", "@peer-scope", "fake-peer");
      expect(lstatSync(fakePeerTargetPath).isSymbolicLink()).toBe(true);

      consoleWarnSpy.mockRestore();
      getInstalledPluginsSpy.mockRestore();
    });
  });
});
