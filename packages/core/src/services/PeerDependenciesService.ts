import { existsSync, mkdirSync, symlinkSync } from "fs";
import { join } from "path";

import { PackageJson } from "./PackageJson";
import { Plugin, PluginService } from "./PluginService";
import { PackageManagerService } from "./PackageManagerService";

type PeerDependency = {
  name: string;
  range: string;
  optional: boolean;
};

type MissingPeer = PeerDependency & {
  requiredBy: string;
};

export class PeerDependenciesService {
  static DEPENDENCIES_FOLDER = "node_modules";

  static async executeResolution(absoluteProjectDir: string): Promise<void> {
    console.info(`Resolving peer dependencies...`);

    const installedPlugins = PluginService.getInstalledPlugins(absoluteProjectDir);
    const missingPeers: MissingPeer[] = [];

    // Collect all missing peers from installed plugins
    for (const plugin of installedPlugins) {
      const peers = PeerDependenciesService.getPluginPeerDependencies(plugin);

      for (const peer of peers) {
        // Skip optional peers
        if (peer.optional) {
          continue;
        }

        // Check if peer is resolvable from consumer root
        const isResolvable = PeerDependenciesService.canResolveFromConsumerRoot(
          absoluteProjectDir,
          peer.name
        );

        if (!isResolvable) {
          missingPeers.push({
            ...peer,
            requiredBy: plugin.fullname,
          });
        }
      }
    }

    // Symlink missing peers
    if (missingPeers.length > 0) {
      await PeerDependenciesService.symlinkMissingPeers(
        absoluteProjectDir,
        installedPlugins,
        missingPeers
      );
    }

    console.info(`Resolving peer dependencies done!`);
  }

  private static getPluginPeerDependencies(plugin: Plugin): PeerDependency[] {
    const pluginPackageJson = PackageJson.fromDirPath(plugin.path);
    const content = pluginPackageJson.getContent();

    const peerDependencies = content.peerDependencies || {};
    const peerDependenciesMeta = content.peerDependenciesMeta || {};

    return Object.entries(peerDependencies).map(([name, range]) => ({
      name,
      range: range as string,
      optional: (peerDependenciesMeta[name] as { optional?: boolean })?.optional || false,
    }));
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

  private static async symlinkMissingPeers(
    absoluteProjectDir: string,
    installedPlugins: Plugin[],
    missingPeers: MissingPeer[]
  ): Promise<void> {
    const projectDependencyPath = join(
      absoluteProjectDir,
      PeerDependenciesService.DEPENDENCIES_FOLDER
    );

    // Get the node_modules path where plugin dependencies are located
    const pluginDependenciesPath = await PackageManagerService.getNodeModulesPath(
      absoluteProjectDir
    );

    // Group missing peers by name to avoid duplicates
    const uniqueMissingPeers = new Map<string, MissingPeer>();
    for (const peer of missingPeers) {
      if (!uniqueMissingPeers.has(peer.name)) {
        uniqueMissingPeers.set(peer.name, peer);
      }
    }

    // Try to symlink each missing peer
    for (const peer of Array.from(uniqueMissingPeers.values())) {
      const peerSourcePath = join(pluginDependenciesPath, peer.name);

      // Check if peer exists in plugin's node_modules
      if (!existsSync(peerSourcePath)) {
        console.warn(
          `- Peer dependency "${peer.name}" required by "${peer.requiredBy}" not found in plugin node_modules`
        );
        continue;
      }

      const peerTargetPath = join(projectDependencyPath, peer.name);

      // Symlink the peer
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
