import { PackageJson } from "../../services/PackageJson";
import { createTestProjectDir, removeTestProjectDir, restorePackageJson } from "../../tests/utils";
import { up } from "./20201024173398-init";

describe("Migration 20201024173398-init", () => {
  let testProjectDir: string;

  beforeAll(() => {
    testProjectDir = createTestProjectDir(__filename);
  });

  afterAll(() => {
    removeTestProjectDir(__filename);
  });

  describe("Up", () => {
    afterEach(() => {
      restorePackageJson(__filename);
    });

    it("should apply migration", async () => {
      await up(testProjectDir);

      const packageJsonContent = PackageJson.fromDirPath(testProjectDir).getContent();

      expect(packageJsonContent).toMatchSnapshot();
    });
  });
});
