import { copyFileSync, existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

import { PackageJson as PackageJsonType } from "type-fest";

import { PackageJsonMerge } from "./PackageJsonMerge";

export type JsonArray = boolean[] | number[] | string[] | JsonFileData[] | Date[];
export type AnyJson = boolean | number | string | JsonFileData | Date | JsonArray | JsonArray[];

export type JsonFileData = {
  [key: string]: AnyJson | undefined;
};
export type PackageJsonContent = JsonFileData & PackageJsonType;

export class PackageJson {
  private content?: PackageJsonContent = undefined;
  constructor(private path: string) {
    if (!existsSync(this.path)) {
      throw new Error(`Package.json "${this.path}" does not exist`);
    }
  }

  getPath(): string {
    return this.path;
  }

  getContent(): PackageJsonContent {
    if (this.content) {
      return this.content;
    }
    return (this.content = JSON.parse(readFileSync(this.path, "utf-8")) as PackageJsonContent);
  }

  setContent(content: PackageJsonContent): void {
    this.content = content;
    this.write();
  }

  getPackageName(): string | undefined {
    return this.getContent().name;
  }

  getPackageVersion(): string | undefined {
    return this.getContent().version;
  }

  isPrivate(): boolean {
    return this.getContent().private === true;
  }

  getTsDevToolsVersion(): string | undefined {
    const tsDevToolsConfig = this.getContent().tsDevTools as JsonFileData | undefined;
    const version = tsDevToolsConfig?.version as string | undefined;
    return version;
  }

  getInstalledPlugins(): string[] {
    const devDependencies = this.getContent().devDependencies;
    if (!devDependencies) {
      return [];
    }

    return Object.keys(devDependencies).filter(
      (devDependency) =>
        devDependency.match(/^@ts-dev-tools\/.*$/) && devDependency !== "@ts-dev-tools/core"
    );
  }

  merge(update: PackageJsonContent): void {
    this.content = PackageJsonMerge.merge(this.getContent(), update);
    this.write();
  }

  backup(): string {
    const backupPath = this.path + ".backup";
    copyFileSync(this.path, backupPath);
    return backupPath;
  }

  restore(backupPath: string): void {
    copyFileSync(backupPath, this.path);
    this.content = undefined;
  }

  private write() {
    writeFileSync(this.path, JSON.stringify(this.content, null, 2));
  }

  static fromDirPath(dirPath: string): PackageJson {
    const packageJsonPath = join(dirPath, "package.json");
    if (!existsSync(packageJsonPath)) {
      throw new Error(`No package.json found in directory "${dirPath}"`);
    }
    return new PackageJson(packageJsonPath);
  }
}
