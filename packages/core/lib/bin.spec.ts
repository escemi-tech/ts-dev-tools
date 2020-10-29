import { ExecException, exec } from "child_process";
import { resolve as resolvePath } from "path";

function cli(
  args: string[]
): Promise<{
  code: number;
  error: ExecException | null;
  stdout: string;
  stderr: string;
}> {
  return new Promise((resolve) => {
    exec(
      `ts-node ${resolvePath("./lib/bin.ts")} ${args.join(" ")}`,
      { cwd: resolvePath("./__tests__/test-project") },
      (error, stdout, stderr) => {
        resolve({
          code: error && error.code ? error.code : 0,
          error,
          stdout: stdout.trim(),
          stderr,
        });
      }
    );
  });
}

describe("bin", () => {
  it("should display version", async () => {
    let result = await cli(["--version"]);
    expect(result.stdout).toMatch(/[0-9]{1}\.[0-9]{1}\.[0-9]{1}/);
    expect(result.code).toBe(0);
  });

  it("should display help", async () => {
    let result = await cli([]);
    expect(result.stdout).toContain(`Usage`);
    expect(result.code).toBe(0);
  });
});
