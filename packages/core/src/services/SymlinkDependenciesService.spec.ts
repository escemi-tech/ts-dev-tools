import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  getConsoleInfoContent,
  mockConsoleInfo,
  resetMockedConsoleInfo,
} from "../tests/console";
import {
  createProjectForTestFile,
  deleteTestProject,
} from "../tests/test-project";
import { CorePackageService } from "./CorePackageService";
import { PackageJson } from "./PackageJson";
import { type Plugin, PluginService } from "./PluginService";
import { SymlinkDependenciesService } from "./SymlinkDependenciesService";

// Set to false to avoid using the cache
const useCache = true;
// Set to false to inspect the test project directory after the test
const shouldCleanupAfterTest = true;

describe("SymlinkDependenciesService", () => {
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
    mockConsoleInfo();
  });

  afterEach(async () => {
    resetMockedConsoleInfo();
    if (shouldCleanupAfterTest) {
      await deleteTestProject(__filename);
    }
  });

  describe("executeSymlinking", () => {
    it("exposes every dependency declared by the installed plugin", async () => {
      PackageJson.fromDirPath(testProjectDir).merge({
        devDependencies: {
          "@ts-dev-tools/core": "1.0.0",
        },
      });

      await SymlinkDependenciesService.executeSymlinking(testProjectDir);

      const dependencies = PackageJson.fromDirPath(
        CorePackageService.getPackageRootPath(),
      ).getDependenciesPackageNames();
      for (const dependency of dependencies) {
        expect(
          existsSync(join(testProjectDir, "node_modules", dependency)),
        ).toBe(true);
      }
      expect(getConsoleInfoContent()).toContain(
        "Symlinking dev dependencies done!",
      );
    });
  });
});
describe("dependency executable links", () => {
  let projectDir: string;
  let plugin: Plugin;

  function createPackage(
    packageDir: string,
    name: string,
    bin: string | Record<string, string> = { runner: "cli.js" },
  ) {
    mkdirSync(packageDir, { recursive: true });
    writeFileSync(
      join(packageDir, "package.json"),
      JSON.stringify({ name, version: "1.0.0", exports: "./cli.js", bin }),
    );
    writeFileSync(
      join(packageDir, "cli.js"),
      '#!/usr/bin/env node\nprocess.stdout.write("runner works");\n',
    );
  }

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), "ts-dev-tools-bins-"));
    plugin = {
      fullname: "@ts-dev-tools/core",
      shortname: "core",
      path: join(projectDir, "node_modules", "@ts-dev-tools", "core"),
    };
    mkdirSync(plugin.path, { recursive: true });
    writeFileSync(
      join(plugin.path, "package.json"),
      JSON.stringify({ dependencies: { "test-runner": "1.0.0" } }),
    );
    vi.spyOn(PluginService, "getInstalledPlugins").mockReturnValue([plugin]);
    vi.spyOn(console, "info").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    rmSync(projectDir, { recursive: true, force: true });
  });

  it("makes a nested dependency executable available to npm workspace scripts", async () => {
    const dependencyDir = join(plugin.path, "node_modules", "test-runner");
    createPackage(dependencyDir, "test-runner", {
      runner: "cli.js",
      "runner-alias": "cli.js",
    });
    writeFileSync(
      join(projectDir, "package.json"),
      JSON.stringify({ private: true, workspaces: ["packages/*"] }),
    );
    const workspaceDir = join(projectDir, "packages", "consumer");
    mkdirSync(workspaceDir, { recursive: true });
    writeFileSync(
      join(workspaceDir, "package.json"),
      JSON.stringify({ name: "consumer", scripts: { test: "runner" } }),
    );

    await SymlinkDependenciesService.executeSymlinking(projectDir);

    expect(realpathSync(join(projectDir, "node_modules", "test-runner"))).toBe(
      dependencyDir,
    );
    expect(
      execFileSync("npm", ["test", "--workspace=consumer"], {
        cwd: projectDir,
        encoding: "utf8",
      }),
    ).toContain("runner works");
    expect(
      realpathSync(join(projectDir, "node_modules", ".bin", "runner-alias")),
    ).toBe(join(dependencyDir, "cli.js"));
  });

  it("links executable strings for scoped packages alongside hoisted dependencies", async () => {
    writeFileSync(
      join(plugin.path, "package.json"),
      JSON.stringify({
        dependencies: { "test-runner": "1.0.0", "@tools/compiler": "1.0.0" },
      }),
    );
    createPackage(
      join(projectDir, "node_modules", "test-runner"),
      "test-runner",
    );
    const compilerDir = join(plugin.path, "node_modules", "@tools", "compiler");
    createPackage(compilerDir, "@tools/compiler", "cli.js");

    await SymlinkDependenciesService.executeSymlinking(projectDir);

    expect(
      realpathSync(join(projectDir, "node_modules", ".bin", "compiler")),
    ).toBe(join(compilerDir, "cli.js"));
    expect(
      realpathSync(join(projectDir, "node_modules", ".bin", "runner")),
    ).toBe(join(projectDir, "node_modules", "test-runner", "cli.js"));
  });

  it("names the executable after the dependency folder when the package has no name", async () => {
    const dependencyDir = join(plugin.path, "node_modules", "test-runner");
    mkdirSync(dependencyDir, { recursive: true });
    writeFileSync(
      join(dependencyDir, "package.json"),
      JSON.stringify({ version: "1.0.0", exports: "./cli.js", bin: "cli.js" }),
    );
    writeFileSync(
      join(dependencyDir, "cli.js"),
      '#!/usr/bin/env node\nprocess.stdout.write("runner works");\n',
    );

    await SymlinkDependenciesService.executeSymlinking(projectDir);

    expect(
      realpathSync(join(projectDir, "node_modules", ".bin", "test-runner")),
    ).toBe(join(dependencyDir, "cli.js"));
  });

  it("restores a missing executable link on repeated setup", async () => {
    createPackage(
      join(plugin.path, "node_modules", "test-runner"),
      "test-runner",
    );
    const executablePath = join(projectDir, "node_modules", ".bin", "runner");
    await SymlinkDependenciesService.executeSymlinking(projectDir);
    rmSync(executablePath);

    await SymlinkDependenciesService.executeSymlinking(projectDir);
    await SymlinkDependenciesService.executeSymlinking(projectDir);

    expect(realpathSync(executablePath)).toBe(
      join(plugin.path, "node_modules", "test-runner", "cli.js"),
    );
  });

  it("uses the dependency already installed in the consumer project", async () => {
    createPackage(
      join(plugin.path, "node_modules", "test-runner"),
      "test-runner",
    );
    const dependencyDir = join(projectDir, "node_modules", "test-runner");
    createPackage(dependencyDir, "test-runner");

    await SymlinkDependenciesService.executeSymlinking(projectDir);

    expect(lstatSync(dependencyDir).isSymbolicLink()).toBe(false);
    expect(
      realpathSync(join(projectDir, "node_modules", ".bin", "runner")),
    ).toBe(join(dependencyDir, "cli.js"));
  });

  it("resolves dependencies from the real location of a linked plugin", async () => {
    const realPluginDir = join(
      projectDir,
      "store",
      "node_modules",
      "@ts-dev-tools",
      "core",
    );
    mkdirSync(realPluginDir, { recursive: true });
    copyFileSync(
      join(plugin.path, "package.json"),
      join(realPluginDir, "package.json"),
    );
    rmSync(plugin.path, { recursive: true });
    symlinkSync(realPluginDir, plugin.path, "junction");
    const dependencyDir = join(realPluginDir, "..", "..", "test-runner");
    createPackage(dependencyDir, "test-runner");

    await SymlinkDependenciesService.executeSymlinking(projectDir);

    expect(realpathSync(join(projectDir, "node_modules", "test-runner"))).toBe(
      dependencyDir,
    );
    expect(
      realpathSync(join(projectDir, "node_modules", ".bin", "runner")),
    ).toBe(join(dependencyDir, "cli.js"));
  });

  it("skips unavailable dependencies and packages without executables", async () => {
    writeFileSync(
      join(plugin.path, "package.json"),
      JSON.stringify({
        dependencies: {
          "unavailable-dependency": "1.0.0",
          "library-only": "1.0.0",
        },
      }),
    );
    createPackage(
      join(plugin.path, "node_modules", "library-only"),
      "library-only",
      {},
    );

    await SymlinkDependenciesService.executeSymlinking(projectDir);

    expect(existsSync(join(projectDir, "node_modules", "library-only"))).toBe(
      true,
    );
    expect(existsSync(join(projectDir, "node_modules", ".bin"))).toBe(false);
  });

  it.each(["file", "symlink"])(
    "preserves an existing executable %s",
    async (kind) => {
      createPackage(
        join(plugin.path, "node_modules", "test-runner"),
        "test-runner",
      );
      const binDir = join(projectDir, "node_modules", ".bin");
      mkdirSync(binDir);
      const executablePath = join(binDir, "runner");
      if (kind === "file") {
        writeFileSync(executablePath, "consumer-owned command");
      } else {
        symlinkSync("consumer-owned-command", executablePath);
      }

      await SymlinkDependenciesService.executeSymlinking(projectDir);

      if (kind === "file") {
        expect(readFileSync(executablePath, "utf8")).toBe(
          "consumer-owned command",
        );
      } else {
        expect(lstatSync(executablePath).isSymbolicLink()).toBe(true);
        expect(() => realpathSync(executablePath)).toThrow();
      }
    },
  );
});
