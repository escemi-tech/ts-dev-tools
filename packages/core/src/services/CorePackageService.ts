import { resolve } from "node:path";

import { PackageJson } from "./PackageJson";

export class CorePackageService {
  private constructor() {}

  static getPackageRootPath() {
    return resolve(__dirname, "../..");
  }

  static getPackageName() {
    return PackageJson.fromDirPath(
      CorePackageService.getPackageRootPath(),
    ).getPackageName();
  }
}
