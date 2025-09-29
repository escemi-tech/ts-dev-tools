import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { getWorkspaceRootPath } from "./workspace-root";

vi.mock("node:fs", () => ({ existsSync: vi.fn() }));

describe("getWorkspaceRootPath", () => {
  const workingDirectoryRoot = join(tmpdir(), "ts-dev-tools-other-workspace");

  beforeEach(() => {
    vi.mocked(existsSync).mockReset();
    vi.spyOn(process, "cwd").mockReturnValue(
      join(workingDirectoryRoot, "packages", "app"),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(["lerna.json", "nx.json"])(
    "prefers the enclosing %s workspace over the working directory",
    (marker) => {
      const enclosingWorkspace = resolve(__dirname, "../..");
      const markers = [
        join(enclosingWorkspace, marker),
        join(workingDirectoryRoot, marker),
      ];
      vi.mocked(existsSync).mockImplementation((path) =>
        markers.includes(String(path)),
      );

      expect(getWorkspaceRootPath()).toBe(enclosingWorkspace);
    },
  );

  it("uses the nearest enclosing workspace", () => {
    const nestedWorkspace = resolve(__dirname, "..");
    const outerWorkspace = resolve(nestedWorkspace, "..");
    const markers = [
      join(nestedWorkspace, "nx.json"),
      join(outerWorkspace, "lerna.json"),
    ];
    vi.mocked(existsSync).mockImplementation((path) =>
      markers.includes(String(path)),
    );

    expect(getWorkspaceRootPath()).toBe(nestedWorkspace);
  });

  it("searches from the working directory when the module has no enclosing workspace", () => {
    vi.mocked(existsSync).mockImplementation(
      (path) => path === join(workingDirectoryRoot, "nx.json"),
    );

    expect(getWorkspaceRootPath()).toBe(workingDirectoryRoot);
  });

  it("falls back to the package layout when neither location has a workspace", () => {
    vi.mocked(existsSync).mockReturnValue(false);

    expect(getWorkspaceRootPath()).toBe(resolve(__dirname, "../../../.."));
  });
});
