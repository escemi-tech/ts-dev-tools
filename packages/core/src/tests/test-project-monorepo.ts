import { join } from "path";
import { PackageJson } from "../services/PackageJson";
import { safeExec } from "./cli";
import {
  createProjectForTestFile,
  createTestProject,
  getPackageNameFromFilepath,
  TestProjectGenerator,
} from "./test-project";

async function generateProjectInMonorepoProject(
  packageName: string,
  projectDir: string,
  useCache: boolean,
  testProjectGenerator: TestProjectGenerator
): Promise<void> {
  await safeExec(projectDir, "npm init --yes");
  await safeExec(projectDir, "npm install");
  await safeExec(projectDir, "npm install --save-dev -W typescript");
  await safeExec(projectDir, "npm exec tsc -- --init");

  PackageJson.fromDirPath(projectDir).merge({
    private: true,
    workspaces: ["packages/*"],
  });

  const packageDir = join(projectDir, "packages/test-package");
  await createTestProject(packageName, packageDir, useCache, testProjectGenerator);

  await safeExec(projectDir, `npm exec lerna -- init --no-progress --skipInstall`);
  await safeExec(projectDir, "npm install");
}

function generateMonorepoProject(
  packageName: string,
  useCache: boolean,
  testProjectGenerator: TestProjectGenerator
): TestProjectGenerator {
  const projectGenerator = (projectDir: string) =>
    generateProjectInMonorepoProject(packageName, projectDir, useCache, testProjectGenerator);

  Object.defineProperty(projectGenerator, "name", {
    value: `monorepo-project-generator-${testProjectGenerator.name}`,
    configurable: true,
  });

  return projectGenerator;
}

export const createTestMonorepoProject = async (
  filepath: string,
  useCache: boolean,
  testProjectGenerator: TestProjectGenerator
) => {
  const packageName = getPackageNameFromFilepath(filepath);
  return createProjectForTestFile(
    filepath,
    useCache,
    generateMonorepoProject(packageName, useCache, testProjectGenerator)
  );
};
