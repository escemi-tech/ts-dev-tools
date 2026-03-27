import { AbstractPackageManagerAdapter } from "./AbstractPackageManagerAdapter";

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
  it("should reject when spawning a missing command fails", async () => {
    const adapter = new TestPackageManagerAdapter();

    await expect(
      adapter.runExecCommand([
        "ts-dev-tools-package-manager-command-that-does-not-exist",
      ]),
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        "ts-dev-tools-package-manager-command-that-does-not-exist",
      ),
    });
  });
});
