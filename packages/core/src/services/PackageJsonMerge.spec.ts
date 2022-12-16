import { PackageJsonMerge } from "./PackageJsonMerge";

describe("PackageJsonMerge", () => {
  describe("merge", () => {
    it("should merge undefined values", () => {
      const source = {};
      const update = { test: "test" };

      const result = PackageJsonMerge.merge(source, update);

      expect(result).toEqual(update);
    });

    it("should merge same values", () => {
      const source = { test: "test" };
      const update = { test: "test" };

      const result = PackageJsonMerge.merge(source, update);

      expect(result).toEqual(source);
    });

    it("should throws an error if values to be merged are different types", () => {
      const source = { test: ["test"] };
      const update = { test: "test" };

      const getPackageJsonPathAction = () => PackageJsonMerge.merge(source, update);

      expect(getPackageJsonPathAction).toThrow(
        "Unable to merge package json value because types are different"
      );
    });

    it("should merge array different values", () => {
      const source = { test: ["test-1"] };
      const update = { test: ["test-2"] };
      const expected = { test: ["test-1", "test-2"] };

      const result = PackageJsonMerge.merge(source, update);

      expect(result).toEqual(expected);
    });

    it("should merge array same values", () => {
      const source = { test: ["test-1"] };
      const update = { test: ["test-1"] };

      const result = PackageJsonMerge.merge(source, update);

      expect(result).toEqual(source);
    });

    it("should merge object different values", () => {
      const source = { test: { deepTest: ["test-1"] } };
      const update = { test: { deepTest: ["test-2"] } };
      const expected = { test: { deepTest: ["test-1", "test-2"] } };

      const result = PackageJsonMerge.merge(source, update);

      expect(result).toEqual(expected);
    });
  });
});
