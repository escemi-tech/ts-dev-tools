import { existsSync, mkdirSync, readdirSync, symlinkSync } from "fs";
import { dirname, join } from "path";

import { PackageJson } from "./PackageJson";
import { Plugin, PluginService } from "./PluginService";

type PeerDependency = {
  name: string;
  optional: boolean;
};

type MissingPeer = PeerDependency & {
  requiredBy: string;
  sourcePath: string;
};

type PackageWithPath = {
  name: string;
  path: string;
};

export class PeerDependenciesService {
  static DEPENDENCIES_FOLDER = "node_modules";

  static async executeResolution(absoluteProjectDir: string): Promise<void> {
    console.info(`Resolving peer dependencies...`);

    const installedPlugins = PluginService.getInstalledPlugins(absoluteProjectDir);
    const missingPeers: MissingPeer[] = [];
    const packagesToInspect = PeerDependenciesService.getPackagesToInspect(
      absoluteProjectDir,
      installedPlugins
    );

    for (const packageToInspect of packagesToInspect) {
      const peers = PeerDependenciesService.getPackagePeerDependencies(packageToInspect.path);

      for (const peer of peers) {
        const isResolvable = PeerDependenciesService.canResolveFromConsumerRoot(
          absoluteProjectDir,
          peer.name
        );

        if (!isResolvable) {
          const sourcePath = PeerDependenciesService.resolvePeerSourcePath(
            absoluteProjectDir,
            packageToInspect.path,
            peer.name
          );

          if (peer.optional && !existsSync(sourcePath)) {
            continue;
          }

          missingPeers.push({
            ...peer,
            requiredBy: packageToInspect.name,
            sourcePath,
          });
        }
      }
    }

    if (missingPeers.length > 0) {
      PeerDependenciesService.symlinkMissingPeers(absoluteProjectDir, missingPeers);
    }

    console.info(`Resolving peer dependencies done!`);
  }

  private static getPackagePeerDependencies(packageDirPath: string): PeerDependency[] {
    const packageJson = PackageJson.fromDirPath(packageDirPath);
    const content = packageJson.getContent();

    const peerDependencies = content.peerDependencies || {};
    const peerDependenciesMeta =
      (content.peerDependenciesMeta as Record<string, { optional?: boolean }>) || {};

    return Object.keys(peerDependencies).map((name) => ({
      name,
      optional: peerDependenciesMeta[name]?.optional || false,
    }));
  }

  private static getPackagesToInspect(
    absoluteProjectDir: string,
    installedPlugins: Plugin[]
  ): PackageWithPath[] {
    const packages = new Map<string, PackageWithPath>();

    for (const plugin of installedPlugins) {
      packages.set(plugin.fullname, {
        name: plugin.fullname,
        path: plugin.path,
      });

      const pluginDependencies = PackageJson.fromDirPath(plugin.path).getDependenciesPackageNames();

      for (const dependencyName of pluginDependencies) {
        const dependencyPath = PeerDependenciesService.resolveDependencyPath(
          absoluteProjectDir,
          plugin.path,
          dependencyName
        );

        if (!dependencyPath) {
          continue;
        }

        if (!packages.has(dependencyName)) {
          packages.set(dependencyName, {
            name: dependencyName,
            path: dependencyPath,
          });
        }
      }
    }

    return Array.from(packages.values());
  }

  private static resolveDependencyPath(
    absoluteProjectDir: string,
    pluginPath: string,
    dependencyName: string
  ): string | undefined {
    const candidatePaths = [
      join(absoluteProjectDir, PeerDependenciesService.DEPENDENCIES_FOLDER, dependencyName),
      join(pluginPath, PeerDependenciesService.DEPENDENCIES_FOLDER, dependencyName),
    ];

    for (const candidatePath of candidatePaths) {
      if (existsSync(join(candidatePath, "package.json"))) {
        return candidatePath;
      }
    }

    return undefined;
  }

  private static resolvePeerSourcePath(
    absoluteProjectDir: string,
    requiredByPath: string,
    peerName: string
  ): string {
    const projectNodeModulesPath = join(
      absoluteProjectDir,
      PeerDependenciesService.DEPENDENCIES_FOLDER
    );

    const directResolution = PeerDependenciesService.resolvePackagePathFrom(requiredByPath, peerName);
    if (directResolution) {
      return directResolution;
    }

    const projectResolution = PeerDependenciesService.resolvePackagePathFrom(
      projectNodeModulesPath,
      peerName
    );
    if (projectResolution) {
      return projectResolution;
    }

    const nestedResolution = PeerDependenciesService.resolveFromNestedNodeModules(
      projectNodeModulesPath,
      peerName
    );
    if (nestedResolution) {
      return nestedResolution;
    }

    return join(projectNodeModulesPath, peerName);
  }

  private static resolveFromNestedNodeModules(
    projectNodeModulesPath: string,
    peerName: string
  ): string | undefined {
    const packageDirs = PeerDependenciesService.getTopLevelPackageDirs(projectNodeModulesPath);

    for (const packageDir of packageDirs) {
      const resolvedPath = PeerDependenciesService.resolvePackagePathFrom(packageDir, peerName);
      if (resolvedPath) {
        return resolvedPath;
      }
    }

    return undefined;
  }

  private static getTopLevelPackageDirs(nodeModulesPath: string): string[] {
    if (!existsSync(nodeModulesPath)) {
      return [];
    }

    const packageDirs: string[] = [];
    const entries = readdirSync(nodeModulesPath);

    for (const entry of entries) {
      const entryPath = join(nodeModulesPath, entry);

      if (!entry.startsWith("@")) {
        packageDirs.push(entryPath);
        continue;
      }

      const scopedEntries = readdirSync(entryPath);
      for (const scopedEntry of scopedEntries) {
        packageDirs.push(join(entryPath, scopedEntry));
      }
    }

    return packageDirs;
  }

  private static resolvePackagePathFrom(fromPath: string, packageName: string): string | undefined {
    try {
      const packageJsonPath = require.resolve(join(packageName, "package.json"), {
        paths: [fromPath],
      });
      return dirname(packageJsonPath);
    } catch {
      return undefined;
    }
  }

  private static canResolveFromConsumerRoot(
    absoluteProjectDir: string,
    packageName: string
  ): boolean {
    const packagePath = join(
      absoluteProjectDir,
      PeerDependenciesService.DEPENDENCIES_FOLDER,
      packageName
    );
    return existsSync(packagePath);
  }

  private static symlinkMissingPeers(
    absoluteProjectDir: string,
    missingPeers: MissingPeer[]
  ): void {
    const projectDependencyPath = join(
      absoluteProjectDir,
      PeerDependenciesService.DEPENDENCIES_FOLDER
    );

    const uniqueMissingPeers = new Map<string, MissingPeer>();
    for (const peer of missingPeers) {
      if (!uniqueMissingPeers.has(peer.name)) {
        uniqueMissingPeers.set(peer.name, peer);
      }
    }

    for (const peer of Array.from(uniqueMissingPeers.values())) {
      const peerSourcePath = peer.sourcePath;
      if (!existsSync(peerSourcePath)) {
        console.warn(
          `- Peer dependency "${peer.name}" required by "${peer.requiredBy}" not found in plugin node_modules`
        );
        continue;
      }

      const peerTargetPath = join(projectDependencyPath, peer.name);

      console.info(`- Symlinking peer dependency "${peer.name}" required by "${peer.requiredBy}"`);
      PeerDependenciesService.symlinkPeer(peerSourcePath, peerTargetPath);
    }
  }

  private static symlinkPeer(sourcePath: string, targetPath: string): void {
    const targetParentFolder = join(targetPath, "..");
    if (!existsSync(targetParentFolder)) {
      mkdirSync(targetParentFolder, { recursive: true });
    }

    symlinkSync(sourcePath, targetPath);
  }
}
