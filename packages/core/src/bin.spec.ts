import { resolve as resolvePath } from "path";

import { exec } from "./tests/cli";

function execBin(args: string[]) {
  return exec(
    resolvePath("./__tests__/test-project"),
    `ts-node ${resolvePath("./src/bin.ts")} ${args.join(" ")}`
  );
}

describe("bin", () => {
  it("should display version", async () => {
    const result = await execBin(["--version"]);
    expect(result.stderr).toBeFalsy();
    expect(result.stdout).toMatch(/[0-9]{1}\.[0-9]{1}\.[0-9]{1}/);
    expect(result.code).toBe(0);
  });

  it("should display help", async () => {
    const result = await execBin([]);
    expect(result.stderr).toBeFalsy();
    expect(result.stdout).toContain(`Usage`);
    expect(result.code).toBe(0);
  });
});
