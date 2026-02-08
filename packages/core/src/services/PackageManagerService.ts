import { existsSync } from "fs";
import { join } from "path";

import { NpmPackageManagerAdapter } from "./package-manager/NpmPackageManagerAdapter";
import { PackageManagerType } from "./package-manager/PackageManagerType";
import type { PackageManagerAdapter } from "./package-manager/PackageManagerAdapter";
import { YarnPackageManagerAdapter } from "./package-manager/YarnPackageManagerAdapter";

export { PackageManagerType } from "./package-manager/PackageManagerType";

export class PackageManagerService {
  static detectPackageManager(dirPath: string): PackageManagerType {
    if (existsSync(join(dirPath, "yarn.lock"))) {
      return PackageManagerType.yarn;
    }
    return PackageManagerType.npm;
  }

  static async addDevPackage(packageName: string, dirPath: string): Promise<void> {
    return PackageManagerService.getAdapter(dirPath).addDevPackage(packageName, dirPath);
  }

  static async isMonorepo(dirPath: string) {
    return PackageManagerService.getAdapter(dirPath).isMonorepo(dirPath);
  }

  static async isPackageInstalled(packageName: string, dirPath: string): Promise<boolean> {
    return PackageManagerService.getAdapter(dirPath).isPackageInstalled(packageName, dirPath);
  }

  static async getNodeModulesPath(dirPath: string): Promise<string> {
    return PackageManagerService.getAdapter(dirPath).getNodeModulesPath(dirPath);
  }

  private static getAdapter(dirPath: string): PackageManagerAdapter {
    const packageManager = PackageManagerService.detectPackageManager(dirPath);

    switch (packageManager) {
      case PackageManagerType.yarn:
        return new YarnPackageManagerAdapter();
      case PackageManagerType.npm:
        return new NpmPackageManagerAdapter();
      default:
        throw new Error(`Unsupported package manager: ${packageManager}`);
    }
  }
}
