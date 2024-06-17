import { copyFileSync, existsSync, readFileSync, writeFileSync } from "fs";

export class FileService {
  static fileExists(filePath: string): boolean {
    return existsSync(filePath);
  }

  static getFileContent(filePath: string): string {
    return readFileSync(filePath, "utf-8");
  }

  static putFileContent(path: string, content: string) {
    writeFileSync(path, content);
  }

  static copyFile(sourcePath: string, destinationPath: string) {
    copyFileSync(sourcePath, destinationPath);
  }
}
