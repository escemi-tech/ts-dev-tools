import { PackageJson } from "../services/PackageJson";
import { getConsoleInfoContent, mockConsoleInfo, resetMockedConsoleInfo } from "../tests/console";
import { createProjectForTestFile, deleteTestProject } from "../tests/test-project";
import { install } from "./command";

// Set to false to avoid using the cache
const useCache = true;
// Set to false to inspect the test project directory after the test
const shouldCleanupAfterTest = true;

describe("Install command", () => {
  let testProjectDir: string;

  beforeEach(async () => {
    testProjectDir = await createProjectForTestFile(__filename, useCache);
    mockConsoleInfo();
  });

  afterEach(async () => {
    resetMockedConsoleInfo();
    if (shouldCleanupAfterTest) {
      await deleteTestProject(__filename);
    }
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

    await expect(installAction()).rejects.toThrow(
      "Unable to install ts-dev-tools in a different folder than current process"
    );
  });
});
