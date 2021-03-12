import { join } from "path";

import { createTestProjectDir, removeTestProjectDir, restorePackageJson } from "../tests/utils";
import { PackageJson, PackageJsonContent } from "./PackageJson";

describe("PackageJson", () => {
  let testProjectDir: string;

  beforeAll(() => {
    testProjectDir = createTestProjectDir(__filename);
  });

  afterAll(() => {
    removeTestProjectDir(__filename);
  });

  describe("constructor", () => {
    it("should throws an error if package.json file does not exist", () => {
      const getPackageJsonPathAction = () => new PackageJson("wrong/path/package.json");

      expect(getPackageJsonPathAction).toThrowError(
        'Package.json "wrong/path/package.json" does not exist'
      );
    });
  });

  describe("fromDir", () => {
    it("should retrieve the package.json instance from the given directory path", () => {
      const packageJson = PackageJson.fromDirPath(testProjectDir);

      expect(packageJson.getPath()).toEqual(testProjectDir + "/package.json");
    });

    it("should throws an error if no package.json exist for the given directory path", () => {
      const getPackageJsonPathAction = () => PackageJson.fromDirPath("wrong/path");

      expect(getPackageJsonPathAction).toThrowError(
        'No package.json found in directory "wrong/path"'
      );
    });
  });

  describe("getContent", () => {
    it("should retrieve the package.json content", () => {
      const packageJson = PackageJson.fromDirPath(testProjectDir).getContent();

      expect(packageJson).toEqual({ version: "1.0.0" });
    });
  });

  describe("getPackageName", () => {
    it("should retrieve the package.json name", () => {
      const packageJson = PackageJson.fromDirPath(testProjectDir);

      const packageName = "test-name";
      packageJson.merge({
        name: packageName,
      });

      const packageJsonName = packageJson.getPackageName();

      expect(packageJsonName).toEqual(packageName);
    });
  });

  describe("getPackageVersion", () => {
    it("should retrieve the package.json version", () => {
      const packageJson = PackageJson.fromDirPath(testProjectDir);

      const packageVersion = "1.0.0";
      packageJson.merge({
        version: packageVersion,
      });

      const packageJsonName = packageJson.getPackageVersion();

      expect(packageJsonName).toEqual(packageVersion);
    });
  });

  describe("getTsDevToolsVersion", () => {
    it("should retrieve the package.json TsDevTools version", () => {
      const packageJson = PackageJson.fromDirPath(testProjectDir);

      const tsDevToolsVersion = "1.0.0";
      packageJson.merge({
        tsDevTools: {
          version: tsDevToolsVersion,
        },
      });

      const packageJsonName = packageJson.getPackageVersion();

      expect(packageJsonName).toEqual(tsDevToolsVersion);
    });
  });

  describe("getInstalledPlugins", () => {
    afterEach(() => {
      restorePackageJson(__filename);
    });

    it("should return an empty array when only @ts-dev-tools/core is installed", () => {
      const packageJson = PackageJson.fromDirPath(testProjectDir);
      packageJson.merge({
        devDependencies: {
          "@ts-dev-tools/core": "1.0.0",
        },
      });
      const installedPlugins = packageJson.getInstalledPlugins();

      expect(installedPlugins).toEqual([]);
    });

    it("should return an empty array when only @ts-dev-tools/react is installed", () => {
      const packageJson = PackageJson.fromDirPath(testProjectDir);
      packageJson.merge({
        devDependencies: {
          "@ts-dev-tools/core": "1.0.0",
          "@ts-dev-tools/react": "1.0.0",
        },
      });

      const installedPlugins = packageJson.getInstalledPlugins();

      expect(installedPlugins).toEqual(["@ts-dev-tools/react"]);
    });
  });

  describe("merge", () => {
    afterEach(() => {
      restorePackageJson(__filename);
    });

    it("should merge the given data in package.json", () => {
      const packageJson = PackageJson.fromDirPath(testProjectDir);

      const dataToMerge: PackageJsonContent = {
        newEntry: { test: "ok" },
      };

      const expectedPackageJson = {
        ...packageJson.getContent(),
        ...dataToMerge,
      };

      packageJson.merge(dataToMerge);
      expect(packageJson.getContent()).toEqual(expectedPackageJson);

      const updatedPackageJson = PackageJson.fromDirPath(testProjectDir);
      expect(updatedPackageJson.getContent()).toEqual(expectedPackageJson);
    });
  });

  describe("restore", () => {
    afterEach(() => {
      restorePackageJson(__filename);
    });

    it("should restore package.json from backup file", () => {
      const packageJson = PackageJson.fromDirPath(testProjectDir);
      const expectedContent = { ...packageJson.getContent() };

      const backupPath = packageJson.backup();
      expect(backupPath).toEqual(join(testProjectDir, "package.json.backup"));

      packageJson.merge({ newData: "test" });
      expect(packageJson.getContent()).not.toEqual(expectedContent);

      packageJson.restore(backupPath);
      expect(packageJson.getContent()).toEqual(expectedContent);
    });
  });
});
