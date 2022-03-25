import { AnyJson, JsonArray, JsonFileData, PackageJsonContent } from "./PackageJson";

export class PackageJsonMerge {
  static merge(source: PackageJsonContent, update: PackageJsonContent): PackageJsonContent {
    return PackageJsonMerge.mergeObjects(source, update);
  }

  private static mergeValues(
    source: AnyJson | undefined,
    update: AnyJson | undefined
  ): AnyJson | undefined {
    if (source === undefined) {
      return update;
    }

    if (!PackageJsonMerge.typesEqual(source, update)) {
      throw new Error(`Unable to merge package json value because types are different`);
    }

    // Deal with arrays
    if (Array.isArray(update)) {
      return PackageJsonMerge.mergeArrays(source as JsonArray[], update as JsonArray[]);
    }

    // Deal with objects
    if (typeof update === "object") {
      return PackageJsonMerge.mergeObjects(
        source as PackageJsonContent,
        update as PackageJsonContent
      );
    }

    return update;
  }

  private static mergeObjects(source: JsonFileData, update: JsonFileData): JsonFileData {
    for (const updateKey in update) {
      if (!Object.prototype.hasOwnProperty.call(update, updateKey)) {
        continue;
      }
      source[updateKey] = PackageJsonMerge.mergeValues(source[updateKey], update[updateKey]);
    }
    return source;
  }

  private static mergeArrays(source: JsonArray[], update: JsonArray[]): JsonArray[] {
    for (const item of update) {
      if (!source.includes(item)) {
        source.push(item);
      }
    }
    return source;
  }

  private static typesEqual(sourceValue: unknown, updateValue: unknown) {
    if (Array.isArray(sourceValue) && !Array.isArray(updateValue)) {
      return false;
    }

    return typeof sourceValue === typeof updateValue;
  }
}
