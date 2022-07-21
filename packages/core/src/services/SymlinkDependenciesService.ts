import { existsSync, symlinkSync } from "fs";
import { join } from "path";

import { PackageJson } from "./PackageJson";
import { Plugin, PluginService } from "./PluginService";

export class SymlinkDependenciesService {
  static DEPENDENCIES_FOLDER = "node_modules";

  static executeSymlinking(absoluteProjectDir: string): void {
    console.info(`Symlinking dev dependencies...`);

    const installedPlugins = PluginService.getInstalledPlugins(absoluteProjectDir);

    for (const plugin of installedPlugins) {
      SymlinkDependenciesService.symlinkPluginDependencies(absoluteProjectDir, plugin);
    }

    console.info(`Symlinking dev dependencies done!`);
  }

  private static symlinkPluginDependencies(absoluteProjectDir: string, plugin: Plugin) {
    const pluginDependencies = SymlinkDependenciesService.getPluginDependencies(plugin);

    for (const pluginDependency of pluginDependencies) {
      const pluginDependencyPath = join(
        plugin.path,
        SymlinkDependenciesService.DEPENDENCIES_FOLDER,
        pluginDependency
      );

      if (!existsSync(pluginDependencyPath)) {
        continue;
      }

      const projectPluginDependencyPath = join(
        absoluteProjectDir,
        SymlinkDependenciesService.DEPENDENCIES_FOLDER,
        pluginDependency
      );
      if (existsSync(projectPluginDependencyPath)) {
        continue;
      }

      console.info(`- Symlinking ${pluginDependency}`);
      SymlinkDependenciesService.symlinkDependency(
        pluginDependencyPath,
        projectPluginDependencyPath
      );
    }
  }

  private static getPluginDependencies(plugin: Plugin): string[] {
    const pluginPackageJson = PackageJson.fromDirPath(plugin.path);
    return pluginPackageJson.getDependenciesPackageNames();
  }

  private static symlinkDependency(
    pluginDependencyPath: string,
    projectPluginDependencyPath: string
  ): void {
    symlinkSync(pluginDependencyPath, projectPluginDependencyPath);
  }
}
