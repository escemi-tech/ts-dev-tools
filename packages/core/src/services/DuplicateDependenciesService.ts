import { PackageJson } from "./PackageJson";
import { Plugin, PluginService } from "./PluginService";

type DuplicateDependencies = Map<string, Set<string>>;

export class DuplicateDependenciesService {
  static executeDeduplication(absoluteProjectDir: string): void {
    console.info(`Checking for duplicate dev dependencies...`);

    const duplicateDependencies: DuplicateDependencies = new Map();
    DuplicateDependenciesService.getProjectDuplicateDependencies(
      absoluteProjectDir,
      duplicateDependencies
    );

    DuplicateDependenciesService.printDuplicatedDependencies(duplicateDependencies);

    console.info(`Check for duplicate dev dependencies done!`);
  }

  private static getProjectDuplicateDependencies(
    absoluteProjectDir: string,
    duplicateDependencies: DuplicateDependencies
  ) {
    const installedPlugins = PluginService.getInstalledPlugins(absoluteProjectDir);

    const projectPackageJson = PackageJson.fromDirPath(absoluteProjectDir);
    const projectDevDependencies = projectPackageJson.getDevDependenciesPackageNames();

    for (const plugin of installedPlugins) {
      DuplicateDependenciesService.getPluginDuplicateDependencies(
        plugin,
        projectDevDependencies,
        duplicateDependencies
      );
    }

    return duplicateDependencies;
  }

  private static getPluginDuplicateDependencies(
    plugin: Plugin,
    projectDevDependencies: string[],
    duplicateDependencies: DuplicateDependencies
  ) {
    // First check for duplicate of inherited plugins
    DuplicateDependenciesService.getProjectDuplicateDependencies(
      plugin.path,
      duplicateDependencies
    );

    const pluginPackageJson = PackageJson.fromDirPath(plugin.path);
    const pluginDependencies = pluginPackageJson.getDependenciesPackageNames();

    let pluginDuplicateDependencies = duplicateDependencies.get(plugin.fullname);
    if (!pluginDuplicateDependencies) {
      pluginDuplicateDependencies = new Set();
      duplicateDependencies.set(plugin.fullname, pluginDuplicateDependencies);
    }

    for (const projectDevDependency of projectDevDependencies) {
      if (pluginDependencies.includes(projectDevDependency)) {
        pluginDuplicateDependencies.add(projectDevDependency);
      }
    }
  }

  private static printDuplicatedDependencies(duplicateDependencies: DuplicateDependencies) {
    let hasDuplicates = false;
    duplicateDependencies.forEach((pluginDuplicateDependencies, plugin) => {
      if (pluginDuplicateDependencies.size) {
        const pluginDuplicateDependenciesValue = Array.from(pluginDuplicateDependencies);
        hasDuplicates = true;
        console.info(
          `Some dev dependencies are unnecessarily installed as their are already required by "${plugin}":\n  - ${pluginDuplicateDependenciesValue.join(
            "\n  - "
          )}\n`
        );
      }
    });

    if (!hasDuplicates) {
      console.info(`No duplicate dev dependencies found.`);
    }
  }
}
