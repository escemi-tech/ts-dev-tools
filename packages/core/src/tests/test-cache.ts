import { existsSync } from "fs";
import { join, resolve } from "path";

const rootDirPath = resolve(__dirname, "../../../..");

export function getTestCacheDirPath(packageName: string, cacheName: string): string {
  if (!packageName) {
    throw new Error("Package name must be provided");
  }
  if (!cacheName) {
    throw new Error("Cache name must be provided");
  }

  const cacheDirPath = resolve(
    join(rootDirPath, "node_modules/.cache/ts-dev-tools", packageName),
    cacheName.toLowerCase().replace(/[^a-z0-9]/g, "-")
  );
  return cacheDirPath;
}

export function testCacheDirExists(packageName: string, cacheName: string): boolean {
  const cacheDirPath = getTestCacheDirPath(packageName, cacheName);
  return existsSync(cacheDirPath);
}
