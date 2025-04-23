import { existsSync, mkdirSync } from "fs";
import { safeExec } from "./cli";

export async function recreateFolderRecursive(path: string): Promise<void> {
  if (existsSync(path)) {
    await deleteFolderRecursive(path);
  }

  mkdirSync(path, { recursive: true });
}

export async function deleteFolderRecursive(path: string) {
  if (existsSync(path)) {
    await safeExec(path, `rm -rf ${path}`);
  }
}

export async function copyFolder(src: string, dest: string): Promise<void> {
  await recreateFolderRecursive(dest);

  const command = [
    "rsync -a",
    "--include='/.git/'",
    "--include='/.git/hooks/'",
    "--include='/.git/hooks/**'",
    "--exclude='/.git/**'",
    `"${src}/"`,
    `"${dest}/"`,
  ].join(" ");

  await safeExec(src, command);
}
