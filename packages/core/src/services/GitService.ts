import {
  chmodSync,
  createWriteStream,
  existsSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

import { PROJECT_NAME, PROJECT_URL } from "../constants";
import { CmdService } from "./CmdService";

export class GitService {
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
    const gitHookDirPath = join(absoluteProjectDir, ".git/hooks");
    const gitHookFilePath = GitService.getGitHookFilePath(
      absoluteProjectDir,
      gitHookName,
    );

    if (existsSync(gitHookFilePath)) {
      const mode = GitService.getFilePermissions(gitHookFilePath);
      if (mode !== GitService.GIT_HOOK_MODE) {
        chmodSync(gitHookFilePath, GitService.GIT_HOOK_MODE);
      }
      return;
    }

    return new Promise((resolve, reject) => {
      const stream = createWriteStream(gitHookFilePath, {
        mode: GitService.GIT_HOOK_MODE,
      });
      stream.on("close", () => resolve(undefined));
      stream.on("error", (error) => reject(error));
      stream.write(
        GitService.GIT_HOOK_TEMPLATE.replace(
          "%gitHookCommand%",
          gitHookCommand,
        ),
      );
      stream.end();
    });
  }

  static updateGitHook(
    absoluteProjectDir: string,
    gitHookName: string,
    oldGitHookCommand: string,
    newGitHookCommand: string,
  ): void {
    const gitHookFilePath = GitService.getGitHookFilePath(
      absoluteProjectDir,
      gitHookName,
    );
    if (!existsSync(gitHookFilePath)) {
      return;
    }

    const currentHookContent = readFileSync(gitHookFilePath, "utf-8");
    const oldManagedHookContent =
      GitService.getManagedGitHookContent(oldGitHookCommand);

    if (currentHookContent !== oldManagedHookContent) {
      return;
    }

    writeFileSync(
      gitHookFilePath,
      GitService.getManagedGitHookContent(newGitHookCommand),
      { mode: GitService.GIT_HOOK_MODE },
    );
  }

  private static getGitHookFilePath(
    absoluteProjectDir: string,
    gitHookName: string,
  ): string {
    return join(absoluteProjectDir, ".git", "hooks", gitHookName);
  }

  private static getManagedGitHookContent(gitHookCommand: string): string {
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
