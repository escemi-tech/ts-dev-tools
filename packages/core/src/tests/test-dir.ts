import { existsSync, mkdirSync } from "fs";
import { tmpdir } from "os";
import { basename, join } from "path";

import { deleteFolderRecursive } from "./file-system";

export const getTestDirPath = (dirName: string, filename: string) =>
  join(tmpdir(), dirName + "-" + basename(filename).split(".")[0]);

export function createTestDir(testDirPath: string, removeIfExists = false): string {
  if (existsSync(testDirPath)) {
    if (!removeIfExists) {
      return testDirPath;
    }
    deleteFolderRecursive(testDirPath);
  }

  mkdirSync(testDirPath);
  return testDirPath;
}

export function removeTestDir(testDirPath: string): void {
  if (!existsSync(testDirPath)) {
    throw new Error(`Test project dir "${testDirPath}" does not exist`);
  }
  deleteFolderRecursive(testDirPath);
}
