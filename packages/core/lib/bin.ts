#!/usr/bin/env node

import { dirname, join } from "path";

import { install } from "./install/command";
import { readPackageJson } from "./services/packageJson";

const [, , arg, ...params] = process.argv;

switch (true) {
  case arg === "install":
    // Check if script is not run by the package himself
    if (process.cwd() === dirname(__dirname)) {
      console.info("Do not install itself!");
      break;
    }

    install({
      cwd: process.cwd(),
      dir: params[0],
    });
    break;
  case ["--version", "-v"].includes(arg):
    console.info(readPackageJson(join(__dirname, "..")).version);
    break;
  default:
    console.info(`Usage
    ts-dev-tools install [path from project root]
  `);
}
