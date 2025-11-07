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

    const args: string[] = [packageManager, "list", "--depth=1", "--json"];

    switch (packageManager) {
      case PackageManagerType.yarn:
        args.push(`--pattern=${packageName}`);
        break;
      case PackageManagerType.npm:
        args.push("--no-progress", "--non-interactive", packageName);
        break;
    }

    let output: string;
    try {
      output = await PackageManagerService.execCommand(args, dirPath, true);
    } catch (error) {
      // npm returns non-zero exit code when package is not found, but still outputs valid JSON
      // So we try to use the error as output if it looks like JSON
      if (typeof error === "string" && error.trim().startsWith("{")) {
        output = error;
      } else {
        // If it's not JSON output, the package is not installed
        return false;
      }
    }

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

  static async getNodeModulesPath(dirPath: string): Promise<string> {
    const packageManager = PackageManagerService.detectPackageManager(dirPath);

    let nodeModulesPath: string;
    switch (packageManager) {
      case PackageManagerType.yarn:
        nodeModulesPath = join(dirPath, "node_modules");
        break;
      case PackageManagerType.npm:
        nodeModulesPath = (
          await PackageManagerService.execCommand(
            [packageManager, "root", "--no-progress", "--non-interactive"],
            dirPath,
            true
          )
        ).trim();
        break;
    }

    if (nodeModulesPath) {
      return nodeModulesPath;
    }

    throw new Error(`Node modules path not found for package manager ${packageManager}`);
  }

  private static async execCommand(
    args: string | string[],
    cwd?: string,
    silent = false
  ): Promise<string> {
    // Handle empty args check for both string and array
    if (Array.isArray(args) && args.length === 0) {
      throw new Error("Command args must not be empty");
    }
    if (typeof args === "string" && args.trim().length === 0) {
      throw new Error("Command args must not be empty");
    }

    if (cwd && !existsSync(cwd)) {
      throw new Error(`Directory "${cwd}" does not exist`);
    }

    let cmd: string;
    let cmdArgs: string[];
    let useShell = false;

    if (Array.isArray(args)) {
      // Check if any arg contains shell-specific syntax (redirections, pipes, etc.)
      const hasShellSyntax = args.some(
        (arg) =>
          arg.includes(">") ||
          arg.includes("|") ||
          arg.includes("&&") ||
          arg.includes("||") ||
          arg.includes(";") ||
          arg.includes("<") ||
          arg.includes(">>") ||
          arg.includes("2>") ||
          arg.includes("&") ||
          arg.includes("$(")
      );

      if (hasShellSyntax) {
        // Use shell mode for commands with shell syntax
        cmd = args.join(" ").trim();
        cmdArgs = [];
        useShell = true;
      } else {
        // Use array mode for normal commands
        cmd = args[0];
        cmdArgs = args.slice(1);
      }
    } else {
      cmd = args;
      cmdArgs = [];
      useShell = true;
    }

    return new Promise((resolve, reject) => {
      const child = spawn(cmd, cmdArgs, {
        stdio: silent ? "pipe" : "inherit",
        shell: useShell,
        windowsVerbatimArguments: true,
        cwd,
      });

      let output = "";
      let error = "";

      child.on("exit", function (code) {
        if (code) {
          // For commands that output to stdout even on error (like npm list),
          // reject with the output so caller can handle it
          return reject(output || error);
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
