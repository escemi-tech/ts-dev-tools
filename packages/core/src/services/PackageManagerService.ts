import { existsSync } from "fs";
import { join } from "path";

export enum PackageManagerType {
  yarn = "yarn",
  npm = "npm",
}

export class PackageManagerService {
  static detectPackageManager(dirPath: string): PackageManagerType {
    if (existsSync(join(dirPath, "yarn.lock"))) {
      return PackageManagerType.yarn;
    }
    return PackageManagerType.npm;
  }
}
