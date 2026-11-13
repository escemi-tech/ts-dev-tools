import {
  chmodSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname } from "node:path";

import { PROJECT_NAME, PROJECT_URL } from "../constants";
import { CmdService } from "./CmdService";

export class GitService {
  private constructor() {}

  static GIT_HOOK_MODE = 0o755;
  static GIT_HOOK_TEMPLATE = `#!/bin/sh

# Created by ${PROJECT_NAME} (${PROJECT_URL})

%gitHookCommand%`;

  static async isGitRepository(absoluteProjectDir: string): Promise<boolean> {
    return await CmdService.execCmd("git rev-parse", absoluteProjectDir, true)
      .then(() => true)
      .catch(() => false);
  }

  static async addGitHook(
    absoluteProjectDir: string,
    gitHookName: string,
    gitHookCommand: string,
  ): Promise<void> {
    const { path: gitHookFilePath, prefix } =
      await GitService.getGitHookContext(absoluteProjectDir, gitHookName);

    if (existsSync(gitHookFilePath)) {
      const mode = GitService.getFilePermissions(gitHookFilePath);
      if (mode !== GitService.GIT_HOOK_MODE) {
        chmodSync(gitHookFilePath, GitService.GIT_HOOK_MODE);
      }
      return;
    }

    mkdirSync(dirname(gitHookFilePath), { recursive: true });

    return new Promise((resolve, reject) => {
      const stream = createWriteStream(gitHookFilePath, {
        mode: GitService.GIT_HOOK_MODE,
      });
      stream.on("close", () => resolve(undefined));
      stream.on("error", (error) => reject(error));
      stream.write(
        GitService.getManagedGitHookContent(
          gitHookCommand,
          gitHookName,
          prefix,
        ),
      );
      stream.end();
    });
  }

  static async updateGitHook(
    absoluteProjectDir: string,
    gitHookName: string,
    oldGitHookCommand: string,
    newGitHookCommand: string,
  ): Promise<void> {
    const { path: gitHookFilePath, prefix } =
      await GitService.getGitHookContext(absoluteProjectDir, gitHookName);
    if (!existsSync(gitHookFilePath)) {
      return;
    }

    const currentHookContent = readFileSync(gitHookFilePath, "utf-8");
    const oldManagedHookContent = GitService.getManagedGitHookContent(
      oldGitHookCommand,
      gitHookName,
      prefix,
    );

    if (currentHookContent !== oldManagedHookContent) {
      return;
    }

    writeFileSync(
      gitHookFilePath,
      GitService.getManagedGitHookContent(
        newGitHookCommand,
        gitHookName,
        prefix,
      ),
      { mode: GitService.GIT_HOOK_MODE },
    );
  }

  private static async getGitHookContext(
    absoluteProjectDir: string,
    gitHookName: string,
  ): Promise<{ path: string; prefix: string }> {
    const output = await CmdService.execCmd(
      [
        "git",
        "rev-parse",
        "--path-format=absolute",
        "--git-path",
        `hooks/${gitHookName}`,
        "--show-prefix",
      ],
      absoluteProjectDir,
      true,
    );
    const [path, prefix = ""] = output.trim().split("\n").filter(Boolean);
    if (!path) {
      throw new Error("Git did not return a hooks path");
    }
    return { path, prefix };
  }

  private static getManagedGitHookContent(
    gitHookCommand: string,
    gitHookName: string,
    projectPrefix: string,
  ): string {
    if (projectPrefix) {
      // Git invokes hooks from the repository root. Keep commit-msg's file
      // argument valid when switching to a nested package directory.
      const prepareArguments =
        gitHookName === "commit-msg"
          ? 'case "$1" in\n  /*) ;;\n  *) set -- "$PWD/$1" ;;\nesac\n\n'
          : "";
      const quotedPrefix = `'${projectPrefix.replaceAll("'", "'\\''")}'`;
      gitHookCommand = `${prepareArguments}cd ${quotedPrefix} || exit\n\n${gitHookCommand}`;
    }
    return GitService.GIT_HOOK_TEMPLATE.replace(
      "%gitHookCommand%",
      gitHookCommand,
    );
  }

  private static getFilePermissions(filePath: string) {
    const { mode } = statSync(filePath);
    return mode & 0o777;
  }
}
