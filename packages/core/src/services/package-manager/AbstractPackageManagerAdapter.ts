import { spawn } from "child_process";
import { existsSync } from "fs";

import { PackageManagerType } from "./PackageManagerType";
import type { PackageManagerAdapter } from "./PackageManagerAdapter";

export abstract class AbstractPackageManagerAdapter implements PackageManagerAdapter {
    abstract addDevPackage(packageName: string, dirPath: string): Promise<void>;
    abstract isMonorepo(dirPath: string): Promise<boolean>;
    abstract isPackageInstalled(packageName: string, dirPath: string): Promise<boolean>;
    abstract getNodeModulesPath(dirPath: string): Promise<string>;

    protected async getVersion(
        packageManager: PackageManagerType,
        dirPath?: string
    ): Promise<{ raw: string; major: number; minor: number; patch: number }> {
        const raw = (await this.execCommand([packageManager, "--version"], dirPath, true)).trim();

        const match = raw.match(/(\d+)\.(\d+)\.(\d+)/);
        if (!match) {
            return { raw, major: 0, minor: 0, patch: 0 };
        }

        return {
            raw,
            major: Number(match[1]),
            minor: Number(match[2]),
            patch: Number(match[3]),
        };
    }

    protected async execCommand(
        args: string | string[],
        cwd?: string,
        silent = false
    ): Promise<string> {
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
            const shellOperators = [">", "|", "&&", "||", ";", "<", ">>", "2>", "&", "$("];

            const hasShellSyntax = args.some((arg) => {
                const trimmedArg = arg.trim();
                return shellOperators.some(
                    (op) =>
                        trimmedArg.startsWith(op) ||
                        trimmedArg.endsWith(op) ||
                        trimmedArg.includes(` ${op} `) ||
                        trimmedArg.includes(` ${op}`) ||
                        trimmedArg.includes(`${op} `)
                );
            });

            if (hasShellSyntax) {
                cmd = args.join(" ").trim();
                cmdArgs = [];
                useShell = true;
            } else {
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

    protected parseJsonLines(output: string): unknown[] {
        return output
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0)
            .map((line) => {
                try {
                    return JSON.parse(line);
                } catch {
                    return undefined;
                }
            })
            .filter((entry) => entry !== undefined);
    }
}
