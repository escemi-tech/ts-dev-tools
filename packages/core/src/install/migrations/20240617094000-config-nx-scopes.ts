import { MigrationUpFunction } from "../../services/MigrationsService";
import { PackageJson } from "../../services/PackageJson";
import { PackageManagerService } from "../../services/PackageManagerService";

export const up: MigrationUpFunction = async (absoluteProjectDir: string): Promise<void> => {
  const packageToInstall = "@commitlint/config-nx-scopes";
  const nxDeps = ["@nrwl/workspace", "nx", "lerna"];

  // Check if project is using nx or lerna
  const packageJson = PackageJson.fromDirPath(absoluteProjectDir);
  const hasNx = nxDeps.some((dep) => packageJson.hasDependency(dep));

  if (!hasNx) {
    return;
  }

  // Ensure that package is installed
  if (!(await PackageManagerService.isPackageInstalled(packageToInstall, absoluteProjectDir))) {
    await PackageManagerService.addDevPackage(packageToInstall, absoluteProjectDir);
  }

  // Update commitlint config
  const commitlint = {
    extends: [packageToInstall],
  };

  packageJson.merge({
    commitlint,
  });
};
