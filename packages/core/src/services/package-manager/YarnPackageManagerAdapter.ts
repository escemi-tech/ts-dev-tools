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
        let lastOutput: string | undefined;
        let hasRecognizedOutput = false;
        let hasSuccessfulCommand = false;

        for (const args of yarnCommands) {
            try {
                const output = await this.execCommand(args, dirPath, true);
                hasSuccessfulCommand = true;
                lastOutput = output;

                const analysis = this.analyzeYarnWorkspacesOutput(output);
                if (analysis.hasEntries) {
                    return true;
                }

                if (analysis.hasRecognizedData) {
                    hasRecognizedOutput = true;
                }
            } catch {
                // Try next command
            }
        }

        if (hasSuccessfulCommand && !hasRecognizedOutput) {
            throw new Error(
                `Unexpected output from "yarn workspaces": ${lastOutput ?? "<empty>"}`
            );
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

    private analyzeYarnWorkspacesOutput(
        output: string
    ): { hasEntries: boolean; hasRecognizedData: boolean } {
        let entries = this.parseJsonLines(output);

        if (entries.length === 0) {
            const jsonBlock = this.extractJsonBlock(output);
            if (jsonBlock && typeof jsonBlock === "object") {
                entries = [jsonBlock];
            }
        }

        if (entries.length === 0) {
            return { hasEntries: false, hasRecognizedData: false };
        }

        let workspaceListCount = 0;
        let hasRecognizedData = false;

        for (const entry of entries) {
            if (!entry || typeof entry !== "object") {
                continue;
            }

            const type = (entry as { type?: string }).type;
            if (type === "error" || type === "warning") {
                continue;
            }

            const data = (entry as { data?: unknown }).data ?? entry;

            const parsedData = this.parseMaybeJsonString(data);
            if (parsedData && typeof parsedData === "object") {
                hasRecognizedData = true;
                if (this.hasWorkspaceMap(parsedData)) {
                    return { hasEntries: true, hasRecognizedData };
                }

                if (this.isWorkspaceInfoMap(parsedData)) {
                    return { hasEntries: true, hasRecognizedData };
                }

                if (this.isWorkspaceListEntry(parsedData)) {
                    workspaceListCount += 1;
                }
            }
        }

        if (workspaceListCount > 0) {
            return { hasEntries: true, hasRecognizedData };
        }
        return { hasEntries: false, hasRecognizedData };
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

    private extractJsonBlock(output: string): unknown {
        const start = output.indexOf("{");
        const end = output.lastIndexOf("}");

        if (start === -1 || end === -1 || end <= start) {
            return undefined;
        }

        const candidate = output.slice(start, end + 1).trim();
        if (candidate.length === 0) {
            return undefined;
        }

        try {
            return JSON.parse(candidate) as unknown;
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

    private isWorkspaceListEntry(value: unknown): boolean {
        if (!value || typeof value !== "object") {
            return false;
        }

        const entry = value as { name?: string; location?: string };
        return typeof entry.name === "string" && typeof entry.location === "string" && entry.location !== ".";
    }

    private isWorkspaceInfoMap(value: unknown): boolean {
        if (!value || typeof value !== "object") {
            return false;
        }

        const entries = Object.values(value as Record<string, unknown>);
        if (entries.length === 0) {
            return false;
        }

        return entries.some((entry) => {
            if (!entry || typeof entry !== "object") {
                return false;
            }

            const location = (entry as { location?: unknown }).location;
            return typeof location === "string" && location.length > 0 && location !== ".";
        });
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
                const children = (entry as { children?: Record<string, unknown> }).children;
                if (children) {
                    const childKeys = Object.keys(children);
                    if (childKeys.some((key) => key.startsWith(packageName + "@"))) {
                        return true;
                    }
                }
                continue;
            }

            if (trees.some((tree) => tree.name.startsWith(packageName + "@"))) {
                return true;
            }
        }

        return false;
    }
}
