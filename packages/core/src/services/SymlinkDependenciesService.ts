import { existsSync, mkdirSync, symlinkSync } from "fs";
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
    const pluginDependenciesPath = join(
      plugin.path,
      SymlinkDependenciesService.DEPENDENCIES_FOLDER
    );

    if (!existsSync(pluginDependenciesPath)) {
      throw new Error(`Plugin dependencies folder not found: ${pluginDependenciesPath}`);
    }

    for (const pluginDependency of pluginDependencies) {
      const pluginDependencyPath = join(pluginDependenciesPath, pluginDependency);

      if (!existsSync(pluginDependencyPath)) {
        continue;
      }

      const projectDependencyPath = join(
        absoluteProjectDir,
        SymlinkDependenciesService.DEPENDENCIES_FOLDER
      );

      const projectPluginDependencyPath = join(projectDependencyPath, pluginDependency);
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
    const pluginDependencyParentFolder = join(projectPluginDependencyPath, "..");
    if (!existsSync(pluginDependencyParentFolder)) {
      mkdirSync(pluginDependencyParentFolder, { recursive: true });
    }

    symlinkSync(pluginDependencyPath, projectPluginDependencyPath);
  }
}
