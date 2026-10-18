#!/usr/bin/env node

import { dirname, join } from "node:path";

import { PROJECT_NAME } from "./constants";
import { install } from "./install/command";
import { PackageJson } from "./services/PackageJson";

export async function bin() {
  const [, , arg, ...params] = process.argv;
  switch (true) {
    case arg === "install":
      // Check if script is not run by the package himself
      if (process.cwd() === dirname(__dirname)) {
        console.info("Do not install itself!");
        break;
      }

      await install({
        cwd: process.cwd(),
        dir: params[0],
      });
      break;
    case ["--version", "-v"].includes(arg):
      console.info(
        PackageJson.fromDirPath(join(__dirname, "..")).getPackageVersion(),
      );
      break;
    default:
      console.info(`Usage
    ${PROJECT_NAME} install [path from project root]
  `);
  }
}

export function handleBinError(error: unknown): void {
  console.error(error);
  process.exitCode = 1;
}

/* v8 ignore next 3 -- CLI entry point wiring, exercised through subprocess e2e tests */
if (require.main === module) {
  bin().catch(handleBinError);
}
