import { randomUUID } from "node:crypto";

describe("React CLI", () => {
  const originalArgv = process.argv;
  const originalExitCode = process.exitCode;

  beforeEach(() => {
    vi.resetModules();
    process.exitCode = undefined;
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.exitCode = originalExitCode;
    vi.restoreAllMocks();
  });

  it("displays help when the entry point runs", async () => {
    const consoleInfo = vi
      .spyOn(console, "info")
      .mockImplementation(() => undefined);
    process.argv = ["node", "ts-dev-tools", "--help"];

    await import("./bin");

    expect(consoleInfo).toHaveBeenCalledWith(
      expect.stringContaining("ts-dev-tools install"),
    );
    expect(process.exitCode).toBeUndefined();
  });

  it("reports installation errors and marks the process as failed", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const missingDirectory = `missing-install-target-${randomUUID()}`;
    process.argv = ["node", "ts-dev-tools", "install", missingDirectory];

    await import("./bin");

    await vi.waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining(missingDirectory),
        }),
      );
      expect(process.exitCode).toBe(1);
    });
  });
});
