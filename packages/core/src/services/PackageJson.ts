import { PackageJson as PackageJsonType } from "type-fest";

import { PackageJsonMerge } from "./PackageJsonMerge";
import { FileService } from "./FileService";
import { join } from "path";

export type JsonArray = boolean[] | number[] | string[] | JsonFileData[] | Date[];
export type AnyJson = boolean | number | string | JsonFileData | Date | JsonArray | JsonArray[];

export type JsonFileData = {
  [key: string]: AnyJson | undefined;
};
export type PackageJsonContent = JsonFileData & PackageJsonType;

export class PackageJson {
  private static readonly PACKAGE_JSON_FILE_NAME = "package.json";

  private content?: PackageJsonContent = undefined;

  constructor(private path: string) {
    if (!FileService.fileExists(this.path)) {
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
    return (this.content = JSON.parse(FileService.getFileContent(this.path)) as PackageJsonContent);
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

  getDependenciesPackageNames(): string[] {
    const dependencies = this.getContent().dependencies;
    return dependencies ? Object.keys(dependencies) : [];
  }

  getDevDependenciesPackageNames(): string[] {
    const devDependencies = this.getContent().devDependencies;
    return devDependencies ? Object.keys(devDependencies) : [];
  }

  getAllDependenciesPackageNames(): string[] {
    return Array.from(
      new Set([...this.getDependenciesPackageNames(), ...this.getDevDependenciesPackageNames()])
    );
  }

  merge(update: PackageJsonContent): void {
    this.content = PackageJsonMerge.merge(this.getContent(), update);
    this.write();
  }

  backup(): string {
    const backupPath = this.path + ".backup";
    FileService.copyFile(this.path, backupPath);
    return backupPath;
  }

  restore(backupPath: string): void {
    FileService.copyFile(backupPath, this.path);
    this.content = undefined;
  }

  private write() {
    FileService.putFileContent(this.path, JSON.stringify(this.content, null, 2));
  }

  static fromDirPath(dirPath: string): PackageJson {
    const packageJsonPath = join(dirPath, PackageJson.PACKAGE_JSON_FILE_NAME);
    return new PackageJson(packageJsonPath);
  }
}
