import { existsSync } from "fs";
import { resolve } from "path";

import { PACKAGE_BASE_NAME } from "../constants";
import { CorePackageService } from "./CorePackageService";
import { PackageJson } from "./PackageJson";

export type Plugin = {
  fullname: string;
  shortname: string;
  path: string;
};

export class PluginService {
  static packageNameIsPlugin(packageName: string) {
    return packageName.match(new RegExp(`^${PACKAGE_BASE_NAME}/.*$`));
  }

  static getInstalledPlugins(absoluteProjectDir: string): Plugin[] {
    const packageJson = PackageJson.fromDirPath(absoluteProjectDir);
    const allDependenciesPackageNames = packageJson.getAllDependenciesPackageNames();
    if (!allDependenciesPackageNames.length) {
      return [];
    }

    const pluginsFullname = allDependenciesPackageNames.filter((packageName) =>
      PluginService.packageNameIsPlugin(packageName)
    );

    const sortPlugins = (pluginA: string, pluginB: string) => pluginA.localeCompare(pluginB);
    pluginsFullname.sort(sortPlugins);

    const plugins = new Map<string, Plugin>();
    for(const pluginFullname of pluginsFullname){
      const plugin = PluginService.getPluginFromFullname(pluginFullname);
      plugins.set(pluginFullname, plugin);
      const pluginParents = PluginService.getInstalledPlugins(plugin.path);
      for(const pluginParent of pluginParents){
        plugins.set(pluginParent.fullname, pluginParent);
      }
    }

    return Array.from(plugins.values());
  }

  static getPluginShortname(fullname: string): string {
    const shortname = fullname.replace(`${PACKAGE_BASE_NAME}/`, "");
    return shortname;
  }

  private static getPluginFromFullname(fullname: string): Plugin {
    const corePackageRootPath = CorePackageService.getPackageRootPath();

    const shortname = PluginService.getPluginShortname(fullname);
    const path = resolve(corePackageRootPath, "../", shortname);

    if (!existsSync(path)) {
      throw new Error(`Plugin "${fullname}" is required but cannot be found in ${path}.`);
    }

    return {
      fullname,
      shortname,
      path,
    };
  }
}
