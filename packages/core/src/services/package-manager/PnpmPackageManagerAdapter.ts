import { existsSync } from "fs";
import { join } from "path";

import { AbstractPackageManagerAdapter } from "./AbstractPackageManagerAdapter";
import { PackageJson } from "../PackageJson";

export class PnpmPackageManagerAdapter extends AbstractPackageManagerAdapter {
    async addDevPackage(packageName: string, dirPath: string): Promise<void> {
        const isMonorepo = await this.isMonorepo(dirPath);
        const args: string[] = ["pnpm", "add", "--save-dev"];

        if (isMonorepo) {
            args.push("--workspace-root");
        }

        args.push(packageName);
        await this.execCommand(args, dirPath, true);
    }

    async isMonorepo(dirPath: string): Promise<boolean> {
        const pnpmWorkspaceFile = join(dirPath, "pnpm-workspace.yaml");
        if (existsSync(pnpmWorkspaceFile)) {
            return true;
        }

        try {
            const packageJson = PackageJson.fromDirPath(dirPath);
            const content = packageJson.getContent();
            return !!content.workspaces;
        } catch {
            return false;
        }
    }

    async isPackageInstalled(packageName: string, dirPath: string): Promise<boolean> {
        const args: string[] = ["pnpm", "list", packageName, "--json", "--depth=1"];

        let output: string;
        try {
            output = await this.execCommand(args, dirPath, true);
        } catch (error) {
            if (typeof error === "string") {
                try {
                    JSON.parse(error.trim());
                    output = error;
                } catch {
                    return false;
                }
            } else {
                return false;
            }
        }

        const installedPackages = JSON.parse(output) as Array<{
            dependencies?: Record<string, unknown>;
            devDependencies?: Record<string, unknown>;
        }>;

        if (Array.isArray(installedPackages) && installedPackages.length > 0) {
            const pkg = installedPackages[0];
            return Boolean(
                (pkg.dependencies && Object.prototype.hasOwnProperty.call(pkg.dependencies, packageName)) ||
                (pkg.devDependencies && Object.prototype.hasOwnProperty.call(pkg.devDependencies, packageName))
            );
        }

        return false;
    }

    async getNodeModulesPath(dirPath: string): Promise<string> {
        const nodeModulesPath = (await this.execCommand(["pnpm", "root"], dirPath, true)).trim();

        if (nodeModulesPath) {
            return nodeModulesPath;
        }

        throw new Error("Node modules path not found for package manager pnpm");
    }
}
