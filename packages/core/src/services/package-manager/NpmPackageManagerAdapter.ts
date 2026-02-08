import { AbstractPackageManagerAdapter } from "./AbstractPackageManagerAdapter";

export class NpmPackageManagerAdapter extends AbstractPackageManagerAdapter {
    async addDevPackage(packageName: string, dirPath: string): Promise<void> {
        const isMonorepo = await this.isMonorepo(dirPath);
        const args: string[] = ["npm", "install", "--save-dev"];

        if (isMonorepo) {
            args.push("--no-workspaces");
        }

        args.push(packageName);
        await this.execCommand(args, dirPath, true);
    }

    async isMonorepo(dirPath: string): Promise<boolean> {
        try {
            await this.execCommand(["npm", "--workspaces", "list", "--json"], dirPath, true);
            return true;
        } catch {
            return false;
        }
    }

    async isPackageInstalled(packageName: string, dirPath: string): Promise<boolean> {
        const args: string[] = [
            "npm",
            "list",
            "--depth=1",
            "--json",
            "--no-progress",
            "--non-interactive",
            packageName,
        ];

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

        const installedPackages = JSON.parse(output);

        return installedPackages.dependencies
            ? Object.prototype.hasOwnProperty.call(installedPackages.dependencies, packageName)
            : false;
    }

    async getNodeModulesPath(dirPath: string): Promise<string> {
        const nodeModulesPath = (
            await this.execCommand(["npm", "root", "--no-progress", "--non-interactive"], dirPath, true)
        ).trim();

        if (nodeModulesPath) {
            return nodeModulesPath;
        }

        throw new Error("Node modules path not found for package manager npm");
    }
}
