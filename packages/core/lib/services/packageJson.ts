import { copyFileSync, existsSync, readFileSync, writeFileSync } from "fs";
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
  const newData = deepmerge(originalData, data, {
    // When merging array, return unique values if array is containingg string only
    arrayMerge: (target, source) => {
      const merged = [...source, ...target];

      const containsOnlyString = merged.every((value) => typeof value === "string");
      if (!containsOnlyString) {
        return merged;
      }

      return merged.filter((v, i, a) => a.indexOf(v) === i);
    },
  });

  writeFileSync(packageJsonPath, JSON.stringify(newData, null, 2));
}

export function getInstalledPlugins(dirPath: string): string[] {
  const packageJson = readPackageJson(dirPath);

  const devDependencies = packageJson.devDependencies;
  if (!devDependencies) {
    return [];
  }

  return Object.keys(devDependencies).filter(
    (devDependency) =>
      devDependency.match(/^@ts-dev-tools\/.*$/) && devDependency !== "@ts-dev-tools/core"
  );
}

export function backupPackageJson(absoluteProjectDir: string) {
  // Backup package.json
  const packageJsonPath = getPackageJsonPath(absoluteProjectDir);
  const packageJsonBackupPath = packageJsonPath + ".backup";
  copyFileSync(packageJsonPath, packageJsonBackupPath);
  return packageJsonBackupPath;
}

export function revertPackageJson(absoluteProjectDir: string, packageJsonBackupPath: string) {
  const packageJsonPath = getPackageJsonPath(absoluteProjectDir);
  copyFileSync(packageJsonBackupPath, packageJsonPath);
}
