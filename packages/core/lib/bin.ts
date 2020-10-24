#!/usr/bin/env node

import { join } from "path";

import { install } from "./install/command";
import { readPackageJson } from "./services/packageJson";

const pkg = readPackageJson(join(__dirname, ".."));

const [, , arg, ...params] = process.argv;

function version() {
  console.log(pkg.version);
}

function help() {
  console.log(`Usage
  js-dev-tools install [path from git root to package.json]
`);
}

switch (true) {
  case arg === "install":
    install({
      cwd: process.cwd(),
      dir: params[0],
    });
    break;
  case ["--version", "-v"].includes(arg):
    version();
    break;
  default:
    help();
}
