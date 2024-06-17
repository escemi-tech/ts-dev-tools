import { MigrationUpFunction } from "../../services/MigrationsService";
import { PackageJson } from "../../services/PackageJson";
import { PackageManagerService } from "../../services/PackageManagerService";

export const up: MigrationUpFunction = async (absoluteProjectDir: string): Promise<void> => {
  // Check if project is using nx or lerna
  const packageJson = PackageJson.fromDirPath(absoluteProjectDir);
  const nxDeps = ["@nrwl/workspace", "nx", "lerna"];
  const hasNx = nxDeps.some((dep) => packageJson.hasDependency(dep));

  if (!hasNx) {
    return;
  }

  // Ensure that "@commitlint/config-nx-scopes" is installed
  if (
    !(await PackageManagerService.isPackageInstalled(
      "@commitlint/config-nx-scopes",
      absoluteProjectDir
    ))
  ) {
    await PackageManagerService.addDevPackage("@commitlint/config-nx-scopes", absoluteProjectDir);
  }

  // Update commitlint config
  const commitlint = {
    extends: ["@commitlint/config-nx-scopes"],
  };

  packageJson.merge({
    commitlint,
  });
};
