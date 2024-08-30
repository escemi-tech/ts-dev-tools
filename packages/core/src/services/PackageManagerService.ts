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
    const isMonorepo = await PackageManagerService.isMonorepo(dirPath);

    const args: string[] = [packageManager];

    switch (packageManager) {
      case PackageManagerType.yarn:
        args.push("add", "--dev");

        if (isMonorepo) {
          args.push("--ignore-workspace-root-check");
        }

        break;
      case PackageManagerType.npm:
        args.push("install", "--save-dev");

        if (isMonorepo) {
          args.push("--no-workspaces");
        }
        break;
    }

    args.push(packageName);

    await PackageManagerService.execCommand(args, dirPath, true);
  }

  static async isMonorepo(dirPath: string) {
    const packageManager = PackageManagerService.detectPackageManager(dirPath);

    const args: string[] = [packageManager];

    switch (packageManager) {
      case PackageManagerType.yarn:
        args.push("workspaces", "info");
        break;

      case PackageManagerType.npm:
        args.push("--workspaces", "list");
        break;
    }

    args.push("> /dev/null 2>&1 && echo true || echo false;");

    const output = await PackageManagerService.execCommand(args, dirPath, true);

    return output.trim() === "true";
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

    const output = await PackageManagerService.execCommand(args, dirPath, true);

    const installedPackages = JSON.parse(output);

    switch (packageManager) {
      case PackageManagerType.yarn:
        return installedPackages?.data?.trees?.some((tree: { name: string }) =>
          tree.name.startsWith(packageName + "@")
        );
      case PackageManagerType.npm:
        return installedPackages.dependencies
          ? Object.prototype.hasOwnProperty.call(installedPackages.dependencies, packageName)
          : false;
    }
  }

  private static async execCommand(
    args: string | string[],
    cwd?: string,
    silent = false
  ): Promise<string> {
    if (!args.length) {
      throw new Error("Command args must not be empty");
    }

    if (cwd && !existsSync(cwd)) {
      throw new Error(`Directory "${cwd}" does not exist`);
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
        stdio: silent ? "pipe" : "inherit",
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
