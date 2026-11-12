import { spawn } from "node:child_process";
import { AbstractPackageManagerAdapter } from "./AbstractPackageManagerAdapter";

vi.mock("node:child_process", { spy: true });

class TestPackageManagerAdapter extends AbstractPackageManagerAdapter {
  async addDevPackage(): Promise<void> {
    throw new Error("Not implemented");
  }

  async isMonorepo(): Promise<boolean> {
    throw new Error("Not implemented");
  }

  async isPackageInstalled(): Promise<boolean> {
    throw new Error("Not implemented");
  }

  async getNodeModulesPath(): Promise<string> {
    throw new Error("Not implemented");
  }

  async runExecCommand(args: string | string[]): Promise<string> {
    return await this.execCommand(args, undefined, true);
  }
}

describe("AbstractPackageManagerAdapter", () => {
  beforeEach(() => {
    vi.mocked(spawn).mockClear();
  });

  it("should reject when spawning a missing command fails", async () => {
    const adapter = new TestPackageManagerAdapter();
    const execution = adapter.runExecCommand([
      "ts-dev-tools-package-manager-command-that-does-not-exist",
    ]);
    const child = vi.mocked(spawn).mock.results[0].value;
    // A failed spawn emits error before close; wait for both before ending the test.
    const closed = new Promise<void>((resolve) => {
      child.once("close", () => resolve());
    });

    await expect(execution).rejects.toMatchObject({
      message: expect.stringContaining(
        "ts-dev-tools-package-manager-command-that-does-not-exist",
      ),
    });
    await closed;
  });

  it("reports the command and exit code when a failed process produces no output", async () => {
    const adapter = new TestPackageManagerAdapter();

    await expect(
      adapter.runExecCommand([process.execPath, "-e", "process.exit(7)"]),
    ).rejects.toBe(`Command "${process.execPath}" failed with exit code 7`);
  });
});
