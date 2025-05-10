import { existsSync, mkdirSync, symlinkSync } from "fs";
import { join } from "path";

import { PackageJson } from "./PackageJson";
import { Plugin, PluginService } from "./PluginService";
import { PackageManagerService } from "./PackageManagerService";

export class SymlinkDependenciesService {
  static DEPENDENCIES_FOLDER = "node_modules";

  static async executeSymlinking(absoluteProjectDir: string): Promise<void> {
    console.info(`Symlinking dev dependencies...`);

    const installedPlugins = PluginService.getInstalledPlugins(absoluteProjectDir);

    for (const plugin of installedPlugins) {
      await SymlinkDependenciesService.symlinkPluginDependencies(absoluteProjectDir, plugin);
    }

    console.info(`Symlinking dev dependencies done!`);
  }

  private static async symlinkPluginDependencies(absoluteProjectDir: string, plugin: Plugin) {
    const pluginDependencies = SymlinkDependenciesService.getPluginDependencies(plugin);

    const projectDependencyPath = join(
      absoluteProjectDir,
      SymlinkDependenciesService.DEPENDENCIES_FOLDER
    );

    const pluginDependenciesPath = await SymlinkDependenciesService.getPluginDependenciesPath(
      absoluteProjectDir,
      plugin
    );

    if (projectDependencyPath === pluginDependenciesPath) {
      console.info(
        `- Skipping symlinking ${plugin.shortname} dependencies, already in node_modules`
      );
      return;
    }

    for (const pluginDependency of pluginDependencies) {
      const pluginDependencyPath = join(pluginDependenciesPath, pluginDependency);

      if (!existsSync(pluginDependencyPath)) {
        continue;
      }

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

  private static async getPluginDependenciesPath(
    absoluteProjectDir: string,
    plugin: Plugin
  ): Promise<string> {
    const pluginDependenciesPath = join(
      plugin.path,
      SymlinkDependenciesService.DEPENDENCIES_FOLDER
    );

    if (existsSync(pluginDependenciesPath)) {
      return pluginDependenciesPath;
    }

    return await PackageManagerService.getNodeModulesPath(absoluteProjectDir);
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
