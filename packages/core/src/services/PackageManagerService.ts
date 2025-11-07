import { spawn } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

import { PackageJson } from "./PackageJson";

export enum PackageManagerType {
  yarn = "yarn",
  npm = "npm",
  pnpm = "pnpm",
}

export class PackageManagerService {
  static detectPackageManager(dirPath: string): PackageManagerType {
    if (existsSync(join(dirPath, "pnpm-lock.yaml"))) {
      return PackageManagerType.pnpm;
    }
    if (existsSync(join(dirPath, "yarn.lock"))) {
      return PackageManagerType.yarn;
    }

    if (existsSync(join(dirPath, "package-lock.json"))) {
      return PackageManagerType.npm;
    }

    throw new Error(`Could not detect package manager in directory: ${dirPath}. No lock file found.`);
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
      case PackageManagerType.pnpm:
        args.push("add", "--save-dev");

        if (isMonorepo) {
          args.push("--workspace-root");
        }
        break;
    }

    args.push(packageName);

    await PackageManagerService.execCommand(args, dirPath, true);
  }

  static async isMonorepo(dirPath: string) {
    const packageManager = PackageManagerService.detectPackageManager(dirPath);

    switch (packageManager) {
      case PackageManagerType.yarn: {
        const args = [packageManager, "workspaces", "info"];
        args.push("> /dev/null 2>&1 && echo true || echo false;");
        const output = await PackageManagerService.execCommand(args, dirPath, true);
        return output.trim() === "true";
      }

      case PackageManagerType.npm: {
        const args = [packageManager, "--workspaces", "list"];
        args.push("> /dev/null 2>&1 && echo true || echo false;");
        const output = await PackageManagerService.execCommand(args, dirPath, true);
        return output.trim() === "true";
      }

      case PackageManagerType.pnpm: {
        // For pnpm, check if pnpm-workspace.yaml exists or if workspaces are defined in package.json
        const pnpmWorkspaceFile = join(dirPath, "pnpm-workspace.yaml");
        if (existsSync(pnpmWorkspaceFile)) {
          return true;
        }
        // Check package.json for workspace field (though pnpm prefers pnpm-workspace.yaml)
        try {
          const packageJson = PackageJson.fromDirPath(dirPath);
          const content = packageJson.getContent();
          return !!(content.workspaces);
        } catch {
          return false;
        }
      }
    }
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
      case PackageManagerType.pnpm:
        args = [
          packageManager,
          "list",
          packageName,
          "--json",
          "--depth=1",
        ];
        break;
    }

    let output: string;
    try {
      output = await PackageManagerService.execCommand(args, dirPath, true);
    } catch (error) {
      // npm returns non-zero exit code when package is not found, but still outputs valid JSON
      if (typeof error === "string") {
        try {
          // Try to parse as JSON - if successful, use it as output
          JSON.parse(error.trim());
          output = error;
        } catch {
          // If it's not valid JSON, the package is not installed
          return false;
        }
      } else {
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
      case PackageManagerType.pnpm:
        // pnpm returns an array of package objects
        if (Array.isArray(installedPackages) && installedPackages.length > 0) {
          const pkg = installedPackages[0];
          return (pkg.dependencies && Object.prototype.hasOwnProperty.call(pkg.dependencies, packageName)) ||
            (pkg.devDependencies && Object.prototype.hasOwnProperty.call(pkg.devDependencies, packageName));
        }
        return false;
      default:
        throw new Error(`Unsupported package manager: ${packageManager}`);
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
      case PackageManagerType.pnpm:
        nodeModulesPath = (
          await PackageManagerService.execCommand(
            [packageManager, "root"],
            dirPath,
            true
          )
        ).trim();
        break;
      default:
        throw new Error(`Unsupported package manager: ${packageManager}`);
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
      // Shell operators that indicate shell-specific syntax requiring shell mode
      // These include redirections (>, <, >>), pipes (|), command chaining (&&, ||, ;),
      // background execution (&), and command substitution ($())
      const SHELL_OPERATORS = [">", "|", "&&", "||", ";", "<", ">>", "2>", "&", "$("];

      // Check if any arg contains shell operators at word boundaries to avoid
      // false positives with URLs (e.g., http://example.com?a=1&b=2) or file paths
      const hasShellSyntax = args.some((arg) => {
        const trimmedArg = arg.trim();
        return SHELL_OPERATORS.some(
          (op) =>
            trimmedArg.startsWith(op) ||
            trimmedArg.endsWith(op) ||
            trimmedArg.includes(` ${op} `) ||
            trimmedArg.includes(` ${op}`) ||
            trimmedArg.includes(`${op} `)
        );
      });

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
          return reject(output.length > 0 ? output : error);
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
