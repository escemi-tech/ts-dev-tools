import {
  existsSync,
  lstatSync,
  mkdirSync,
  realpathSync,
  symlinkSync,
} from "node:fs";
import { createRequire } from "node:module";
import { basename, join } from "node:path";
import binLinks from "bin-links";

import { PackageJson } from "./PackageJson";
import { type Plugin, PluginService } from "./PluginService";

export class SymlinkDependenciesService {
  private constructor() {}

  static DEPENDENCIES_FOLDER = "node_modules";

  static async executeSymlinking(absoluteProjectDir: string): Promise<void> {
    console.info(`Symlinking dev dependencies...`);
    binLinks.resetSeen();

    const installedPlugins =
      PluginService.getInstalledPlugins(absoluteProjectDir);

    for (const plugin of installedPlugins) {
      await SymlinkDependenciesService.symlinkPluginDependencies(
        absoluteProjectDir,
        plugin,
      );
    }

    console.info(`Symlinking dev dependencies done!`);
  }

  private static async symlinkPluginDependencies(
    absoluteProjectDir: string,
    plugin: Plugin,
  ) {
    const pluginDependencies =
      SymlinkDependenciesService.getPluginDependencies(plugin);

    const projectDependencyPath = join(
      absoluteProjectDir,
      SymlinkDependenciesService.DEPENDENCIES_FOLDER,
    );

    for (const pluginDependency of pluginDependencies) {
      const projectPluginDependencyPath = join(
        projectDependencyPath,
        pluginDependency,
      );
      if (!existsSync(projectPluginDependencyPath)) {
        const pluginDependencyPath =
          SymlinkDependenciesService.getPluginDependencyPath(
            plugin,
            pluginDependency,
          );
        if (!pluginDependencyPath) {
          continue;
        }

        console.info(`- Symlinking ${pluginDependency}`);
        SymlinkDependenciesService.symlinkDependency(
          pluginDependencyPath,
          projectPluginDependencyPath,
        );
      }

      await SymlinkDependenciesService.symlinkExecutables(
        projectPluginDependencyPath,
        join(projectDependencyPath, ".bin"),
      );
    }
  }

  private static getPluginDependencies(plugin: Plugin): string[] {
    const pluginPackageJson = PackageJson.fromDirPath(plugin.path);
    return pluginPackageJson.getDependenciesPackageNames();
  }

  private static getPluginDependencyPath(
    plugin: Plugin,
    dependencyName: string,
  ): string | undefined {
    const pluginRequire = createRequire(
      join(realpathSync(plugin.path), "package.json"),
    );
    return pluginRequire.resolve
      .paths(dependencyName)
      ?.map((searchPath) => join(searchPath, dependencyName))
      .find((dependencyPath) =>
        existsSync(join(dependencyPath, "package.json")),
      );
  }

  private static async symlinkExecutables(
    dependencyPath: string,
    binDirectory: string,
  ): Promise<void> {
    const pkg = PackageJson.fromDirPath(dependencyPath).getContent();
    const declaredBins =
      typeof pkg.bin === "string"
        ? { [basename(pkg.name ?? dependencyPath)]: pkg.bin }
        : (pkg.bin ?? {});
    const bin = Object.fromEntries(
      Object.entries(declaredBins).filter(([name]) => {
        const extensions =
          process.platform === "win32" ? ["", ".cmd", ".ps1"] : [""];
        return extensions.every(
          (extension) =>
            !lstatSync(join(binDirectory, `${name}${extension}`), {
              throwIfNoEntry: false,
            }),
        );
      }),
    );
    if (Object.keys(bin).length === 0) {
      return;
    }
    await binLinks({
      path: dependencyPath,
      pkg: { ...pkg, bin },
      force: false,
    });
  }

  private static symlinkDependency(
    pluginDependencyPath: string,
    projectPluginDependencyPath: string,
  ): void {
    const pluginDependencyParentFolder = join(
      projectPluginDependencyPath,
      "..",
    );
    if (!existsSync(pluginDependencyParentFolder)) {
      mkdirSync(pluginDependencyParentFolder, { recursive: true });
    }

    symlinkSync(pluginDependencyPath, projectPluginDependencyPath);
  }
}
