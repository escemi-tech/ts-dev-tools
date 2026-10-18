import { resolve as resolvePath } from "node:path";
import { handleBinError } from "./bin";
import { exec } from "./tests/cli";

function execBin(cmd?: string) {
  return exec(
    resolvePath("./__tests__/test-project"),
    `ts-node --files ${resolvePath("./src/bin.ts")} ${cmd || ""}`.trim(),
  );
}

describe("bin", () => {
  it("should display version", async () => {
    const result = await execBin("--version");
    expect(result.stderr).toBeFalsy();
    expect(result.stdout).toMatch(/[0-9]+\.[0-9]+\.[0-9]+/);
    expect(result.code).toBe(0);
  }, 10000);

  it("should display help", async () => {
    const result = await execBin();
    expect(result.stderr).toBeFalsy();
    expect(result.stdout).toContain(`Usage`);
    expect(result.code).toBe(0);
  }, 10000);

  it("exits unsuccessfully when installation fails", async () => {
    const result = await execBin("install missing-install-target");

    expect(result.stderr).toContain("Unable to install ts-dev-tools");
    expect(result.code).toBe(1);
  }, 10000);
});

describe("handleBinError", () => {
  it("logs the error and marks the process as failed", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const previousExitCode = process.exitCode;
    const error = new Error("boom");

    try {
      handleBinError(error);

      expect(consoleError).toHaveBeenCalledWith(error);
      expect(process.exitCode).toBe(1);
    } finally {
      process.exitCode = previousExitCode;
      consoleError.mockRestore();
    }
  });
});
