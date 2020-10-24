import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

import deepmerge from "deepmerge";
import { PackageJson as PackageJsonType } from "type-fest";

export function getPackageJsonPath(dirPath: string) {
  const packageJsonPath = join(dirPath, "package.json");

  if (!existsSync(packageJsonPath)) {
    throw new Error(`No package.json found in directory "${dirPath}"`);
  }

  return packageJsonPath;
}

export type PackageJson = PackageJsonType & {
  [key: string]: any;
};

export function readPackageJson(dirPath: string): PackageJson {
  return JSON.parse(readFileSync(getPackageJsonPath(dirPath), "utf-8")) as PackageJson;
}

export function updatePackageJson(dirPath: string, data: any) {
  const packageJsonPath = getPackageJsonPath(dirPath);
  const originalData = JSON.parse(readFileSync(packageJsonPath, { encoding: "utf8" }));
  const newData = deepmerge(originalData, data);

  writeFileSync(packageJsonPath, JSON.stringify(newData));
}
