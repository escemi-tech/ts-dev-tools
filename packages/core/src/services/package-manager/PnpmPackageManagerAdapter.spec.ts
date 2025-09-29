import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PnpmPackageManagerAdapter } from "./PnpmPackageManagerAdapter";

class StubPnpmPackageManagerAdapter extends PnpmPackageManagerAdapter {
  override execCommand =
    vi.fn<
      (
        args: string | string[],
        cwd?: string,
        silent?: boolean,
      ) => Promise<string>
    >();
}

describe("PnpmPackageManagerAdapter", () => {
  let projectDir: string;
  let adapter: StubPnpmPackageManagerAdapter;

  beforeEach(async () => {
    projectDir = await mkdtemp(join(tmpdir(), "ts-dev-tools-pnpm-adapter-"));
    adapter = new StubPnpmPackageManagerAdapter();
    adapter.execCommand.mockResolvedValue("");
  });

  afterEach(async () => {
    await rm(projectDir, { recursive: true, force: true });
  });

  describe("isMonorepo", () => {
    it("recognizes a pnpm workspace without a package manifest", async () => {
      await writeFile(
        join(projectDir, "pnpm-workspace.yaml"),
        "packages:\n  - packages/*\n",
      );

      await expect(adapter.isMonorepo(projectDir)).resolves.toBe(true);
    });

    it("recognizes workspaces declared in package.json", async () => {
      await writeFile(
        join(projectDir, "package.json"),
        JSON.stringify({ private: true, workspaces: ["packages/*"] }),
      );

      await expect(adapter.isMonorepo(projectDir)).resolves.toBe(true);
    });

    it("returns false when the manifest has no workspaces", async () => {
      await writeFile(join(projectDir, "package.json"), "{}");

      await expect(adapter.isMonorepo(projectDir)).resolves.toBe(false);
    });

    it("returns false when the manifest is missing", async () => {
      await expect(adapter.isMonorepo(projectDir)).resolves.toBe(false);
    });

    it("returns false when the manifest is invalid", async () => {
      await writeFile(join(projectDir, "package.json"), "invalid JSON");

      await expect(adapter.isMonorepo(projectDir)).resolves.toBe(false);
    });
  });

  describe("addDevPackage", () => {
    it("adds a development dependency to a standalone project", async () => {
      await writeFile(join(projectDir, "package.json"), "{}");

      await adapter.addDevPackage("typescript", projectDir);

      expect(adapter.execCommand).toHaveBeenCalledExactlyOnceWith(
        ["pnpm", "add", "--save-dev", "typescript"],
        projectDir,
        true,
      );
    });

    it("allows adding a development dependency at the workspace root", async () => {
      await writeFile(
        join(projectDir, "pnpm-workspace.yaml"),
        "packages:\n  - packages/*\n",
      );

      await adapter.addDevPackage("typescript", projectDir);

      expect(adapter.execCommand).toHaveBeenCalledExactlyOnceWith(
        ["pnpm", "add", "--save-dev", "--workspace-root", "typescript"],
        projectDir,
        true,
      );
    });
  });

  describe("isPackageInstalled", () => {
    it.each([
      {
        description: "a production dependency",
        output: [{ dependencies: { typescript: { version: "6.0.3" } } }],
        installed: true,
      },
      {
        description:
          "a development dependency alongside production dependencies",
        output: [
          {
            dependencies: { vitest: { version: "5.0.3" } },
            devDependencies: { typescript: { version: "6.0.3" } },
          },
        ],
        installed: true,
      },
      {
        description: "a development dependency without production dependencies",
        output: [{ devDependencies: { typescript: { version: "6.0.3" } } }],
        installed: true,
      },
      {
        description: "only unrelated dependencies",
        output: [{ dependencies: {}, devDependencies: { vitest: {} } }],
        installed: false,
      },
      {
        description: "a project without dependencies",
        output: [{}],
        installed: false,
      },
      { description: "an empty list", output: [], installed: false },
      { description: "a non-array result", output: {}, installed: false },
    ])("handles $description", async ({ output, installed }) => {
      adapter.execCommand.mockResolvedValue(JSON.stringify(output));

      await expect(
        adapter.isPackageInstalled("typescript", projectDir),
      ).resolves.toBe(installed);
      expect(adapter.execCommand).toHaveBeenCalledExactlyOnceWith(
        ["pnpm", "list", "typescript", "--json", "--depth=1"],
        projectDir,
        true,
      );
    });

    it("does not mistake inherited properties for installed packages", async () => {
      adapter.execCommand.mockResolvedValue('[{"dependencies":{}}]');

      await expect(
        adapter.isPackageInstalled("toString", projectDir),
      ).resolves.toBe(false);
    });

    it("reads dependency data when pnpm exits unsuccessfully with JSON output", async () => {
      adapter.execCommand.mockRejectedValue(
        '\n [{"dependencies":{"typescript":{"version":"6.0.3"}}}] \n',
      );

      await expect(
        adapter.isPackageInstalled("typescript", projectDir),
      ).resolves.toBe(true);
    });

    it("returns false when a failed command lists no dependencies", async () => {
      adapter.execCommand.mockRejectedValue("[]");

      await expect(
        adapter.isPackageInstalled("typescript", projectDir),
      ).resolves.toBe(false);
    });

    it("returns false when pnpm fails with a plain-text diagnostic", async () => {
      adapter.execCommand.mockRejectedValue("pnpm: command failed");

      await expect(
        adapter.isPackageInstalled("typescript", projectDir),
      ).resolves.toBe(false);
    });

    it("returns false when the pnpm process cannot be started", async () => {
      adapter.execCommand.mockRejectedValue(new Error("spawn pnpm ENOENT"));

      await expect(
        adapter.isPackageInstalled("typescript", projectDir),
      ).resolves.toBe(false);
    });
  });

  describe("getNodeModulesPath", () => {
    it("returns the root path without command-output whitespace", async () => {
      const nodeModulesPath = join(projectDir, "node_modules");
      adapter.execCommand.mockResolvedValue(`\n ${nodeModulesPath} \n`);

      await expect(adapter.getNodeModulesPath(projectDir)).resolves.toBe(
        nodeModulesPath,
      );
      expect(adapter.execCommand).toHaveBeenCalledExactlyOnceWith(
        ["pnpm", "root"],
        projectDir,
        true,
      );
    });

    it("rejects when pnpm returns no node_modules path", async () => {
      adapter.execCommand.mockResolvedValue(" \n\t");

      await expect(adapter.getNodeModulesPath(projectDir)).rejects.toThrow(
        "Node modules path not found for package manager pnpm",
      );
    });
  });
});
