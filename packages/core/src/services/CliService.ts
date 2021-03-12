import { spawn } from "child_process";
import { existsSync, statSync } from "fs";

export class CmdService {
  static execCmd(args: string | string[], cwd?: string, silent = false): Promise<string> {
    if (!args.length) {
      throw new Error("Command args must not be empty");
    }

    if (cwd) {
      if (!existsSync(cwd) || !statSync(cwd).isDirectory()) {
        throw new Error(`Directory "${cwd}" does not exist`);
      }
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
