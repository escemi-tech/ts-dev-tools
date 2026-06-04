import { PackageJson } from "../../services/PackageJson";
import { PackageManagerService } from "../../services/PackageManagerService";
import {
  createProjectForTestFile,
  deleteTestProject,
} from "../../tests/test-project";
import { hooks, up } from "./20201024173398-init";

// Set to false to avoid using the cache
const useCache = true;
// Set to false to inspect the test project directory after the test
const shouldCleanupAfterTest = true;

describe("Migration 20201024173398-init", () => {
  let testProjectDir: string;

  beforeAll(() => {
    if (!useCache) {
      console.warn("Cache is disabled. Enable it one dev is done.");
    }
    if (!shouldCleanupAfterTest) {
      console.warn("Cleanup is disabled. Enable it one dev is done.");
    }
  });

  beforeEach(async () => {
    testProjectDir = await createProjectForTestFile(__filename, useCache);
  });

  afterEach(async () => {
    if (shouldCleanupAfterTest) {
      await deleteTestProject(__filename);
    }
  });

  describe("Up", () => {
    it("should apply migration", async () => {
      await up(testProjectDir);

      const packageJsonContent =
        PackageJson.fromDirPath(testProjectDir).getContent();

      expect(packageJsonContent).toMatchSnapshot();
    });
  });

  describe("hooks", () => {
    it("should export the managed hooks with a package-manager-aware pre-push command", () => {
      const detectPackageManagerSpy = vi
        .spyOn(PackageManagerService, "detectPackageManager")
        .mockReturnValue("yarn");

      try {
        expect(hooks[0]).toEqual({
          name: "pre-commit",
          command:
            "npx --no-install lint-staged && npx --no-install pretty-quick --staged",
        });
        expect(hooks[1]).toEqual({
          name: "commit-msg",
          command: "npx --no-install commitlint --edit $1",
        });
        expect(typeof hooks[2]?.command).toBe("function");
        expect(
          (hooks[2]?.command as (absoluteProjectDir: string) => string)(
            testProjectDir,
          ),
        ).toBe("yarn run lint && yarn run build && yarn run test");
      } finally {
        detectPackageManagerSpy.mockRestore();
      }
    });
  });
});
