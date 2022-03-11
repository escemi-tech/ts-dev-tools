import { chmodSync, createWriteStream, existsSync, statSync } from "fs";
import { join } from "path";

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
    gitHookCommand: string
  ): Promise<void> {
    const gitHookDirPath = join(absoluteProjectDir, ".git/hooks");
    const gitHookFilePath = join(gitHookDirPath, gitHookName);

    if (existsSync(gitHookFilePath)) {
      const mode = GitService.getFilePermissions(gitHookFilePath);
      if (mode !== GitService.GIT_HOOK_MODE) {
        chmodSync(gitHookFilePath, GitService.GIT_HOOK_MODE);
      }
      return;
    }

    return new Promise((resolve, reject) => {
      const stream = createWriteStream(gitHookFilePath, { mode: GitService.GIT_HOOK_MODE });
      stream.on("close", () => resolve(undefined));
      stream.on("error", (error) => reject(error));
      stream.write(GitService.GIT_HOOK_TEMPLATE.replace("%gitHookCommand%", gitHookCommand));
      stream.end();
    });
  }

  private static getFilePermissions(filePath: string) {
    const { mode } = statSync(filePath);
    return mode & parseInt("777", 8);
  }
}
