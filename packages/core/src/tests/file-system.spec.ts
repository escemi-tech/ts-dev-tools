import { existsSync } from "node:fs";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  readlink,
  rm,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  copyFolder,
  deleteFolderRecursive,
  recreateFolderRecursive,
} from "./file-system";

describe("test file system", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), "ts-dev-tools-files-"));
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it("copies fixtures and executable hooks while excluding other Git metadata", async () => {
    const src = join(testDir, "source directory");
    const dest = join(testDir, "destination directory");
    await mkdir(join(src, ".git", "hooks"), { recursive: true });
    await mkdir(join(src, ".git", "objects"));
    await writeFile(join(src, "package.json"), "{}");
    await writeFile(join(src, ".git", "config"), "git config");
    await writeFile(join(src, ".git", "objects", "object"), "git object");
    await writeFile(join(src, ".git", "hooks", "pre-commit"), "#!/bin/sh\n");
    await chmod(join(src, ".git", "hooks", "pre-commit"), 0o755);
    await symlink("package.json", join(src, "package-link.json"));
    await mkdir(dest);
    await writeFile(join(dest, "stale-file"), "stale");

    await copyFolder(src, dest);

    expect(await readFile(join(dest, "package.json"), "utf8")).toBe("{}");
    expect(await readlink(join(dest, "package-link.json"))).toBe(
      "package.json",
    );
    expect(
      (await stat(join(dest, ".git", "hooks", "pre-commit"))).mode & 0o777,
    ).toBe(0o755);
    expect(existsSync(join(dest, ".git", "config"))).toBe(false);
    expect(existsSync(join(dest, ".git", "objects"))).toBe(false);
    expect(existsSync(join(dest, "stale-file"))).toBe(false);
  });

  it("recreates an empty directory when its path contains shell characters", async () => {
    const path = join(testDir, "fixture ; directory");
    await mkdir(path);
    await writeFile(join(path, "stale-file"), "stale");

    await recreateFolderRecursive(path);

    expect((await stat(path)).isDirectory()).toBe(true);
    expect(existsSync(join(path, "stale-file"))).toBe(false);
  });

  it("deletes a directory and allows repeated cleanup", async () => {
    const path = join(testDir, "fixture directory");
    await mkdir(path);
    await writeFile(join(path, "file"), "fixture");

    await deleteFolderRecursive(path);
    await deleteFolderRecursive(path);

    expect(existsSync(path)).toBe(false);
  });
});
