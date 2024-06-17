import { spawn } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

export enum PackageManagerType {
  yarn = "yarn",
  npm = "npm",
}

export class PackageManagerService {
  static detectPackageManager(dirPath: string): PackageManagerType {
    if (existsSync(join(dirPath, "yarn.lock"))) {
      return PackageManagerType.yarn;
    }
    return PackageManagerType.npm;
  }

  static async addDevPackage(packageName: string, dirPath: string): Promise<void> {
    const packageManager = PackageManagerService.detectPackageManager(dirPath);
    switch (packageManager) {
      case PackageManagerType.yarn:
        await PackageManagerService.execCommand(["yarn", "add", "--dev", packageName], dirPath);
        break;
      case PackageManagerType.npm:
        await PackageManagerService.execCommand(
          ["npm", "install", "--save-dev", packageName],
          dirPath
        );
        break;
    }
  }

  static async isPackageInstalled(packageName: string, dirPath: string): Promise<boolean> {
    const packageManager = PackageManagerService.detectPackageManager(dirPath);

    const args = [
      packageManager,
      "list",
      "--depth=1",
      "--json",
      "--no-progress",
      `--pattern="${packageName}"`,
      "--non-interactive",
    ];

    const output = await PackageManagerService.execCommand(args, dirPath);
    const installedPackages = JSON.parse(output);

    switch (packageManager) {
      case PackageManagerType.yarn:
        return installedPackages.data.trees.some(
          (tree: { name: string }) => tree.name === packageName
        );
      case PackageManagerType.npm:
        return installedPackages.dependencies[packageName] !== undefined;
    }
  }

  private static async execCommand(args: string | string[], cwd: string): Promise<string> {
    if (!args.length) {
      throw new Error("Command args must not be empty");
    }

    let cmd: string;
    if (Array.isArray(args)) {
      cmd = args.shift() || "";
    } else {
      cmd = args;
      args = [];
    }

    return new Promise((resolve, reject) => {
      const child = spawn(cmd, args as string[], {
        stdio: "inherit",
        shell: true,
        windowsVerbatimArguments: true,
        cwd,
      });

      let output = "";
      let error = "";

      child.on("exit", function (code) {
        if (code) {
          return reject(error);
        }
        resolve(output);
      });

      if (child.stdout) {
        child.stdout.on("data", (data) => {
          output += `\n${data}`;
        });
      }
      if (child.stderr) {
        child.stderr.on("data", (data) => {
          error += `\n${data}`;
        });
      }
    });
  }
}
