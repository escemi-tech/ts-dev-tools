import { readFileSync } from "fs";
import { join } from "path";

import {
  createTestProjectDirWithFixtures,
  removeTestProjectDir,
  restorePackageJson,
} from "../tests/project";
import { PackageJson, PackageJsonContent } from "./PackageJson";

describe("PackageJson", () => {
  let testProjectDir: string;

  beforeAll(() => {
    testProjectDir = createTestProjectDirWithFixtures(__filename);
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

  describe("setContent", () => {
    it("should override the package.json content", () => {
      const packageJson = PackageJson.fromDirPath(testProjectDir);

      const newContent = {
        name: "new-content",
      };
      packageJson.setContent(newContent);

      const packageJsonContent = packageJson.getContent();
      expect(packageJsonContent).toEqual(newContent);

      const realPackageJsonContent = readFileSync(packageJson.getPath()).toString();
      expect(realPackageJsonContent).toEqual(JSON.stringify(newContent, null, 2));
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

      const expectedPackageVersion = "1.0.0";
      packageJson.merge({
        version: expectedPackageVersion,
      });

      const packageVersion = packageJson.getPackageVersion();

      expect(packageVersion).toEqual(expectedPackageVersion);
    });
  });

  describe("isPrivate", () => {
    it("should retrieve true if the package is private", () => {
      const packageJson = PackageJson.fromDirPath(testProjectDir);

      packageJson.merge({
        private: true,
      });

      const isPrivate = packageJson.isPrivate();

      expect(isPrivate).toBe(true);
    });

    it("should retrieve false if the package is not private", () => {
      const packageJson = PackageJson.fromDirPath(testProjectDir);
      packageJson.merge({
        private: false,
      });

      const isPrivate = packageJson.isPrivate();

      expect(isPrivate).toBe(false);
    });
  });

  describe("getTsDevToolsVersion", () => {
    afterEach(() => {
      restorePackageJson(__filename);
    });

    it("should retrieve the package.json TsDevTools version", () => {
      const packageJson = PackageJson.fromDirPath(testProjectDir);

      const expectedTsDevToolsVersion = "1.0.0";
      packageJson.merge({
        tsDevTools: {
          version: expectedTsDevToolsVersion,
        },
      });

      const tsDevToolsVersion = packageJson.getTsDevToolsVersion();

      expect(tsDevToolsVersion).toEqual(expectedTsDevToolsVersion);
    });

    it("should retrieve undefined the package.json TsDevTools version when none found", () => {
      const packageJson = PackageJson.fromDirPath(testProjectDir);

      const tsDevToolsVersion = packageJson.getTsDevToolsVersion();

      expect(tsDevToolsVersion).toBeUndefined();
    });
  });

  describe("getDependenciesPackageNames", () => {
    afterEach(() => {
      restorePackageJson(__filename);
    });

    it("should return installed dependencies package names", () => {
      const packageJson = PackageJson.fromDirPath(testProjectDir);
      packageJson.merge({
        dependencies: {
          "test-dependency": "1.0.0",
        },
      });
      const dependenciesPackageNames = packageJson.getDependenciesPackageNames();

      expect(dependenciesPackageNames).toEqual(["test-dependency"]);
    });

    it("should return an empty array when no dependencies are installed", () => {
      const packageJson = PackageJson.fromDirPath(testProjectDir);
      const dependenciesPackageNames = packageJson.getDependenciesPackageNames();

      expect(dependenciesPackageNames).toEqual([]);
    });

    it("should return installed dev dependencies package names", () => {
      const packageJson = PackageJson.fromDirPath(testProjectDir);
      packageJson.merge({
        devDependencies: {
          "test-dependency": "1.0.0",
        },
      });
      const devDependenciesPackageNames = packageJson.getDevDependenciesPackageNames();

      expect(devDependenciesPackageNames).toEqual(["test-dependency"]);
    });

    it("should return an empty array when no dev dependencies are installed", () => {
      const packageJson = PackageJson.fromDirPath(testProjectDir);
      const devDependenciesPackageNames = packageJson.getDevDependenciesPackageNames();

      expect(devDependenciesPackageNames).toEqual([]);
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
