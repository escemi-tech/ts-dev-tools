import { resolve } from "path";

import { PackageJson } from "./PackageJson";

type DuplicateDependencies = Map<string, Set<string>>;

export class DuplicateDependenciesService {
  static duplicateDependencies(tsDevToolsRootPath: string, absoluteProjectDir: string): void {
    console.info(`Checking for duplicate dev dependencies...`);

    const duplicateDependencies: DuplicateDependencies = new Map();
    DuplicateDependenciesService.getProjectDuplicateDependencies(
      tsDevToolsRootPath,
      absoluteProjectDir,
      duplicateDependencies
    );

    DuplicateDependenciesService.printDuplicateDependencies(duplicateDependencies);

    console.info(`Check for duplicate dev dependencies done!`);
  }

  private static getProjectDuplicateDependencies(
    tsDevToolsRootPath: string,
    absoluteProjectDir: string,
    duplicateDependencies: DuplicateDependencies
  ) {
    const projectPackageJson = PackageJson.fromDirPath(absoluteProjectDir);
    const installedPlugins = projectPackageJson.getInstalledPlugins();
    const projectDevDependencies = projectPackageJson.getDevDependenciesPackageNames();

    for (const plugin of installedPlugins) {
      DuplicateDependenciesService.getPluginDuplicateDependencies(
        tsDevToolsRootPath,
        plugin,
        projectDevDependencies,
        duplicateDependencies
      );
    }

    return duplicateDependencies;
  }

  private static getPluginDuplicateDependencies(
    tsDevToolsRootPath: string,
    plugin: string,
    projectDevDependencies: string[],
    duplicateDependencies: DuplicateDependencies
  ) {
    const absolutePluginDir = resolve(tsDevToolsRootPath, "../../", plugin);

    // First check for duplicate of inherited plugins
    DuplicateDependenciesService.getProjectDuplicateDependencies(
      tsDevToolsRootPath,
      absolutePluginDir,
      duplicateDependencies
    );

    const pluginPackageJson = PackageJson.fromDirPath(absolutePluginDir);
    const pluginDependencies = pluginPackageJson.getDependenciesPackageNames();

    let pluginDuplicateDependencies = duplicateDependencies.get(plugin);
    if (!pluginDuplicateDependencies) {
      pluginDuplicateDependencies = new Set();
      duplicateDependencies.set(plugin, pluginDuplicateDependencies);
    }

    for (const projectDevDependency of projectDevDependencies) {
      if (pluginDependencies.includes(projectDevDependency)) {
        pluginDuplicateDependencies.add(projectDevDependency);
      }
    }
  }

  private static printDuplicateDependencies(duplicateDependencies: DuplicateDependencies) {
    duplicateDependencies.forEach((pluginDuplicateDependencies, plugin) => {
      if (pluginDuplicateDependencies.size) {
        const pluginDuplicateDependenciesValue = Array.from(pluginDuplicateDependencies);
        console.info(
          `Some dev dependencies are unnecessarily installed as their are already required by "${plugin}":"\n  - "${pluginDuplicateDependenciesValue.join(
            "\n  - "
          )}\n`
        );
      }
    });
  }
}
