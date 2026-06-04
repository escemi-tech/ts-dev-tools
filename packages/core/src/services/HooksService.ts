import { GitService } from "./GitService";

export type ManagedGitHookCommand =
  | string
  | ((absoluteProjectDir: string) => string);

export type ManagedGitHook = {
  name: string;
  command: ManagedGitHookCommand;
};

export type AppliedManagedGitHook = {
  name: string;
  command: string;
  legacyCommands: string[];
};

export class HooksService {
  private constructor() {}

  static consolidateManagedGitHooks(
    absoluteProjectDir: string,
    managedGitHooks: ManagedGitHook[],
    consolidatedManagedGitHooks: Map<string, AppliedManagedGitHook>,
  ): void {
    for (const managedGitHook of managedGitHooks) {
      const resolvedHook = HooksService.resolveManagedGitHook(
        absoluteProjectDir,
        managedGitHook,
      );
      const currentHook = consolidatedManagedGitHooks.get(resolvedHook.name);

      if (!currentHook) {
        consolidatedManagedGitHooks.set(resolvedHook.name, resolvedHook);
        continue;
      }

      const legacyCommands = Array.from(
        new Set([...currentHook.legacyCommands, currentHook.command]),
      ).filter((command) => command !== resolvedHook.command);

      consolidatedManagedGitHooks.set(resolvedHook.name, {
        ...resolvedHook,
        legacyCommands,
      });
    }
  }

  static async applyManagedGitHooks(
    absoluteProjectDir: string,
    managedGitHooks: AppliedManagedGitHook[],
  ): Promise<void> {
    const isGitRepository =
      await GitService.isGitRepository(absoluteProjectDir);

    if (!isGitRepository) {
      return;
    }

    for (const managedGitHook of managedGitHooks) {
      await GitService.addGitHook(
        absoluteProjectDir,
        managedGitHook.name,
        managedGitHook.command,
      );

      for (const legacyCommand of managedGitHook.legacyCommands) {
        GitService.updateGitHook(
          absoluteProjectDir,
          managedGitHook.name,
          legacyCommand,
          managedGitHook.command,
        );
      }
    }
  }

  private static resolveManagedGitHook(
    absoluteProjectDir: string,
    managedGitHook: ManagedGitHook,
  ): AppliedManagedGitHook {
    return {
      name: managedGitHook.name,
      command: HooksService.resolveManagedGitHookCommand(
        absoluteProjectDir,
        managedGitHook.command,
      ),
      legacyCommands: [],
    };
  }

  private static resolveManagedGitHookCommand(
    absoluteProjectDir: string,
    managedGitHookCommand: ManagedGitHookCommand,
  ): string {
    if (typeof managedGitHookCommand === "function") {
      return managedGitHookCommand(absoluteProjectDir);
    }

    return managedGitHookCommand;
  }
}
