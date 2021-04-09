import { resolve } from "path";

import { PackageJson } from "./PackageJson";

export class DuplicateDependenciesService {
  static duplicateDependencies(tsDevToolsRootPath: string, absoluteProjectDir: string): void {
    const projectPackageJson = PackageJson.fromDirPath(absoluteProjectDir);
    const installedPlugins = projectPackageJson.getInstalledPlugins();

    console.info(`Checking for duplicate dev dependencies...`);

    for (const plugin of installedPlugins) {
      DuplicateDependenciesService.duplicatePluginDependencies(
        tsDevToolsRootPath,
        projectPackageJson,
        plugin
      );
    }

    console.info(`Check for duplicate dev dependencies done!`);
  }

  private static duplicatePluginDependencies(
    tsDevToolsRootPath: string,
    projectPackageJson: PackageJson,
    plugin: string
  ): void {
    const absolutePluginDir = resolve(tsDevToolsRootPath, "../../", plugin);
    const pluginPackageJson = PackageJson.fromDirPath(absolutePluginDir);

    const projectDevDependencies = projectPackageJson.getDevDependenciesPackageNames();
    const pluginDependencies = pluginPackageJson.getDependenciesPackageNames();

    const duplicateDependencies = projectDevDependencies.filter((dependency) =>
      pluginDependencies.includes(dependency)
    );

    if (duplicateDependencies.length) {
      console.info(
        `Some dev dependencies are unnecessarily installed as their are already required by "${plugin}":"\n  - "${duplicateDependencies.join(
          "\n  - "
        )}\n`
      );
    }
  }
}
