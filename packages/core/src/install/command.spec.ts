import { PackageJson } from "../services/PackageJson";
import { getConsoleInfoContent, mockConsoleInfo, resetMockedConsoleInfo } from "../tests/console";
import { createTestProjectDir, removeTestProjectDir, restorePackageJson } from "../tests/utils";
import { install } from "./command";

describe("Install command", () => {
  let testProjectDir: string;

  beforeAll(() => {
    testProjectDir = createTestProjectDir(__filename);
  });

  afterAll(() => {
    removeTestProjectDir(__filename);
  });

  beforeEach(() => {
    mockConsoleInfo();
  });

  afterEach(() => {
    resetMockedConsoleInfo();
    restorePackageJson(__filename);
  });

  it("should run fresh installation without error", async () => {
    const installAction = () => install({ cwd: testProjectDir, dir: "." });

    await expect(installAction()).resolves.toBeUndefined();
    expect(getConsoleInfoContent()).toMatchSnapshot();
  });

  it("should run update without error", async () => {
    PackageJson.fromDirPath(testProjectDir).merge({
      tsDevTools: {
        version: "20201024173398-init",
      },
    });

    const installAction = () => install({ cwd: testProjectDir, dir: "." });

    await expect(installAction()).resolves.toBeUndefined();
    expect(getConsoleInfoContent()).toMatchSnapshot();
  });

  it("should throws an error if project dir path is not a child of current working directory", async () => {
    const installAction = () => install({ cwd: testProjectDir, dir: ".." });

    await expect(installAction()).rejects.toThrowError(".. not allowed");
  });
});
