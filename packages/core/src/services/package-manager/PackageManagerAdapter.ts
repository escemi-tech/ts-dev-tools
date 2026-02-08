export interface PackageManagerAdapter {
    addDevPackage(packageName: string, dirPath: string): Promise<void>;
    isMonorepo(dirPath: string): Promise<boolean>;
    isPackageInstalled(packageName: string, dirPath: string): Promise<boolean>;
    getNodeModulesPath(dirPath: string): Promise<string>;
}
