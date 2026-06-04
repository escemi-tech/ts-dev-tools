import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

const findWorkspaceRoot = (startDir: string): string | undefined => {
  let currentDir = startDir;

  while (true) {
    if (
      existsSync(join(currentDir, "lerna.json")) ||
      existsSync(join(currentDir, "nx.json"))
    ) {
      return currentDir;
    }

    const parentDir = resolve(currentDir, "..");
    if (parentDir === currentDir) {
      return undefined;
    }
    currentDir = parentDir;
  }
};

export const getWorkspaceRootPath = (): string =>
  findWorkspaceRoot(__dirname) ??
  findWorkspaceRoot(process.cwd()) ??
  resolve(__dirname, "../../../..");
