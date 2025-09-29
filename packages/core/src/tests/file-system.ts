import { cp, mkdir, rm } from "node:fs/promises";
import { relative, sep } from "node:path";

export async function recreateFolderRecursive(path: string): Promise<void> {
  await deleteFolderRecursive(path);
  await mkdir(path, { recursive: true });
}

export async function deleteFolderRecursive(path: string): Promise<void> {
  await rm(path, { recursive: true, force: true });
}

export async function copyFolder(src: string, dest: string): Promise<void> {
  await recreateFolderRecursive(dest);
  await cp(src, dest, {
    recursive: true,
    preserveTimestamps: true,
    verbatimSymlinks: true,
    filter: (sourcePath) => {
      const parts = relative(src, sourcePath).split(sep);
      return parts[0] !== ".git" || parts.length === 1 || parts[1] === "hooks";
    },
  });
}
