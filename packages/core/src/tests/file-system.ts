import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  rmdirSync,
  unlinkSync,
} from "fs";
import { join } from "path";

export function deleteFolderRecursive(path: string) {
  if (existsSync(path)) {
    readdirSync(path).forEach((file) => {
      const curPath = join(path, file);
      if (lstatSync(curPath).isDirectory()) {
        // recurse
        deleteFolderRecursive(curPath);
      } else {
        // delete file
        unlinkSync(curPath);
      }
    });
    rmdirSync(path);
  }
}

export function copyFolderSync(from: string, to: string) {
  if (!existsSync(to)) {
    mkdirSync(to);
  }
  readdirSync(from).forEach((element) => {
    if (lstatSync(join(from, element)).isFile()) {
      copyFileSync(join(from, element), join(to, element));
    } else {
      copyFolderSync(join(from, element), join(to, element));
    }
  });
}
