import { join } from "path";

import { AbstractPackageManagerAdapter } from "./AbstractPackageManagerAdapter";
import { PackageManagerType } from "./PackageManagerType";

export class YarnPackageManagerAdapter extends AbstractPackageManagerAdapter {
    async addDevPackage(packageName: string, dirPath: string): Promise<void> {
        const isMonorepo = await this.isMonorepo(dirPath);
        const { major } = await this.getVersion(PackageManagerType.yarn, dirPath);

        const args: string[] = ["yarn", "add", "--dev"];

        if (isMonorepo) {
            args.push(major >= 2 ? "-W" : "--ignore-workspace-root-check");
        }

        args.push(packageName);

        try {
            await this.execCommand(args, dirPath, true);
        } catch (error) {
            if (isMonorepo && typeof error === "string" && error.includes("Unsupported option name")) {
                const retryArgs = args
                    .filter((arg) => arg !== "--ignore-workspace-root-check" && arg !== "-W")
                    .concat(major >= 2 ? "--ignore-workspace-root-check" : "-W");
                await this.execCommand(retryArgs, dirPath, true);
                return;
            }

            throw error;
        }
    }

    async isMonorepo(dirPath: string): Promise<boolean> {
        const { major } = await this.getVersion(PackageManagerType.yarn, dirPath);
        const primary = major >= 2 ? "list" : "info";
        const fallback = primary === "list" ? "info" : "list";
        const yarnCommands: string[][] = [
            ["yarn", "workspaces", primary, "--json"],
            ["yarn", "workspaces", fallback, "--json"],
        ];

        for (const args of yarnCommands) {
            try {
                const output = await this.execCommand(args, dirPath, true);
                if (this.yarnWorkspacesOutputHasEntries(output)) {
                    return true;
                }
            } catch {
                // Try next command
            }
        }

        return false;
    }

    async isPackageInstalled(packageName: string, dirPath: string): Promise<boolean> {
        try {
            const output = await this.execCommand(
                ["yarn", "list", "--depth=1", "--json", "--pattern", packageName],
                dirPath,
                true
            );
            if (this.yarnListOutputHasPackage(output, packageName)) {
                return true;
            }
        } catch {
            // Fallback for Yarn versions that don't support `yarn list`
        }

        try {
            const output = await this.execCommand(["yarn", "why", "--json", packageName], dirPath, true);
            return this.yarnListOutputHasPackage(output, packageName);
        } catch {
            return false;
        }
    }

    async getNodeModulesPath(dirPath: string): Promise<string> {
        return join(dirPath, "node_modules");
    }

    private yarnWorkspacesOutputHasEntries(output: string): boolean {
        const entries = this.parseJsonLines(output);

        let workspaceListCount = 0;

        for (const entry of entries) {
            if (!entry || typeof entry !== "object") {
                continue;
            }

            const data = (entry as { data?: unknown }).data ?? entry;

            const parsedData = this.parseMaybeJsonString(data);
            if (parsedData && typeof parsedData === "object") {
                if (this.hasWorkspaceMap(parsedData)) {
                    return true;
                }

                if (this.isWorkspaceListEntry(parsedData)) {
                    workspaceListCount += 1;
                }
            }
        }

        if (workspaceListCount > 0) {
            return true;
        }

        const parsedOutput = this.parseJsonObjectFromOutput(output);
        if (parsedOutput && typeof parsedOutput === "object") {
            return Object.keys(parsedOutput as Record<string, unknown>).length > 0;
        }

        return false;
    }

    private parseMaybeJsonString(value: unknown): unknown {
        if (typeof value !== "string") {
            return value;
        }

        try {
            return JSON.parse(value) as unknown;
        } catch {
            return undefined;
        }
    }

    private hasWorkspaceMap(value: unknown): boolean {
        if (!value || typeof value !== "object") {
            return false;
        }

        const workspaces = (value as { workspaces?: Record<string, unknown> }).workspaces;
        return !!workspaces && Object.keys(workspaces).length > 0;
    }

    private parseJsonObjectFromOutput(output: string): unknown {
        const start = output.indexOf("{");
        const end = output.lastIndexOf("}");

        if (start < 0 || end <= start) {
            return undefined;
        }

        const slice = output.slice(start, end + 1).trim();
        try {
            return JSON.parse(slice) as unknown;
        } catch {
            return undefined;
        }
    }

    private isWorkspaceListEntry(value: unknown): boolean {
        if (!value || typeof value !== "object") {
            return false;
        }

        const entry = value as { name?: string; location?: string };
        return typeof entry.name === "string" && typeof entry.location === "string" && entry.location !== ".";
    }

    private yarnListOutputHasPackage(output: string, packageName: string): boolean {
        const entries = this.parseJsonLines(output);

        for (const entry of entries) {
            if (!entry || typeof entry !== "object") {
                continue;
            }

            const data = (entry as { data?: { trees?: Array<{ name: string }> } }).data;
            const trees = data?.trees ?? (entry as { trees?: Array<{ name: string }> }).trees;

            if (!trees) {
                continue;
            }

            if (trees.some((tree) => tree.name.startsWith(packageName + "@"))) {
                return true;
            }
        }

        return false;
    }
}
