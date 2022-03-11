import { resolve } from "path";

import { PackageJson } from "./PackageJson";

export class CorePackageService {
  static getPackageRootPath() {
    return resolve(__dirname, "../..");
  }

  static getPackageName() {
    return PackageJson.fromDirPath(CorePackageService.getPackageRootPath()).getPackageName();
  }
}
