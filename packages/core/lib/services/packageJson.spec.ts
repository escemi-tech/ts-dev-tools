import { createTestProjectDir, removeTestProjectDir, restorePackageJson } from "../tests/utils";
import { getPackageJsonPath, readPackageJson, updatePackageJson } from "./packageJson";

describe("PackageJson", () => {
  let testProjectDir: string;

  beforeAll(() => {
    testProjectDir = createTestProjectDir(__filename);
  });

  afterAll(() => {
    removeTestProjectDir(__filename);
  });

  describe("getPackageJsonPath", () => {
    it("should retrieve the package.json path for the given directory path", () => {
      const packageJsonPath = getPackageJsonPath(testProjectDir);

      expect(packageJsonPath).toEqual(testProjectDir + "/package.json");
    });

    it("should throws an error if no package.json exist for the given directory path", () => {
      const getPackageJsonPathAction = () => getPackageJsonPath("wrong/path");

      expect(getPackageJsonPathAction).toThrowError(
        'No package.json found in directory "wrong/path"'
      );
    });
  });

  describe("readPackageJson", () => {
    it("should retrieve the package.json content", () => {
      const packageJson = readPackageJson(testProjectDir);

      expect(packageJson).toEqual({ version: "1.0.0" });
    });
  });

  describe("updatePackageJson", () => {
    afterEach(() => {
      restorePackageJson(__filename);
    });

    it("should add a new entry in package.json", () => {
      updatePackageJson(testProjectDir, { newEntry: { test: "ok" } });
      const packageJson = readPackageJson(testProjectDir);

      expect(packageJson).toMatchObject({ newEntry: { test: "ok" }, version: "1.0.0" });
    });

    it("should update a property in package.json", () => {
      updatePackageJson(testProjectDir, { version: "2.0.0" });
      const packageJson = readPackageJson(testProjectDir);

      expect(packageJson).toMatchObject({ version: "2.0.0" });
    });
  });
});
