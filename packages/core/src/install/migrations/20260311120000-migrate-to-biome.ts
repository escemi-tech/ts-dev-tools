import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";

import { CmdService } from "../../services/CmdService";
import { FileService } from "../../services/FileService";
import { GitService } from "../../services/GitService";
import type { MigrationUpFunction } from "../../services/MigrationsService";
import { PackageJson } from "../../services/PackageJson";

const BIOME_CONFIG_FILE_NAME = "biome.json";
const ESLINT_CONFIG_FILE_NAME = "eslint.config.mjs";
const PRE_COMMIT_HOOK_NAME = "pre-commit";
const BIOME_INIT_COMMAND = "npx --no-install @biomejs/biome init";

const OLD_PRE_COMMIT_COMMAND =
  "npx --no-install lint-staged && npx --no-install pretty-quick --staged";
const NEW_PRE_COMMIT_COMMAND = "npx --no-install biome check --staged --write";

const MANAGED_ESLINT_MARKERS = [
  "tsDevToolsCore",
  "tsDevToolsReact",
  "export default tsDevTools",
];

const VITE_VANILLA_APP_ELEMENT_PATTERN =
  "document.querySelector<HTMLDivElement>('#app')!.innerHTML = `";
const VITE_VANILLA_APP_ELEMENT_REPLACEMENT = `const appElement = document.querySelector<HTMLDivElement>("#app");

if (!appElement) {
  throw new Error("Could not find #app element");
}

appElement.innerHTML = \``;
const VITE_VANILLA_COUNTER_PATTERN =
  "setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)";
const VITE_VANILLA_COUNTER_REPLACEMENT = `const counterElement = document.querySelector<HTMLButtonElement>("#counter");

if (!counterElement) {
  throw new Error("Could not find #counter element");
}

setupCounter(counterElement)`;
const VITE_REACT_ROOT_PATTERN =
  "createRoot(document.getElementById('root')!).render(";
const VITE_REACT_ROOT_REPLACEMENT = `const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Could not find #root element");
}

createRoot(rootElement).render(`;
const VITE_REACT_BUTTON_PATTERN = "<button onClick={";
const VITE_REACT_BUTTON_REPLACEMENT = '<button type="button" onClick={';

export const up: MigrationUpFunction = async (
  absoluteProjectDir: string,
): Promise<void> => {
  const packageJson = PackageJson.fromDirPath(absoluteProjectDir);
  const packageJsonContent = packageJson.getContent();
  const hasManagedEslintConfigFile =
    projectHasManagedEslintConfigFile(absoluteProjectDir);

  const hasBiomeConfig = projectHasBiomeConfig(absoluteProjectDir);
  if (!hasBiomeConfig) {
    await runBiomeInit(absoluteProjectDir);
  }

  delete packageJsonContent.eslintConfig;
  delete packageJsonContent.prettier;
  delete packageJsonContent.importSort;
  delete packageJsonContent["lint-staged"];

  packageJsonContent.scripts = {
    ...packageJsonContent.scripts,
    format: "biome format --write .",
    lint: "biome lint .",
    check: "biome check --write .",
  };

  packageJson.setContent(packageJsonContent);

  enableBiomeVcsIntegration(absoluteProjectDir);
  migrateCommonViteStarterFiles(absoluteProjectDir);
  deleteManagedEslintConfig(absoluteProjectDir, hasManagedEslintConfigFile);
  updateManagedPreCommitHook(absoluteProjectDir);
};

async function runBiomeInit(absoluteProjectDir: string): Promise<void> {
  await CmdService.execCmd(BIOME_INIT_COMMAND, absoluteProjectDir, true);
}

function enableBiomeVcsIntegration(absoluteProjectDir: string): void {
  const biomeConfigFilePath = join(absoluteProjectDir, BIOME_CONFIG_FILE_NAME);

  if (!FileService.fileExists(biomeConfigFilePath)) {
    return;
  }

  let biomeConfigContent: {
    vcs?: {
      clientKind?: string;
      enabled?: boolean;
      useIgnoreFile?: boolean;
    };
  };

  try {
    biomeConfigContent = JSON.parse(
      FileService.getFileContent(biomeConfigFilePath),
    ) as typeof biomeConfigContent;
  } catch {
    console.warn(
      `Could not parse ${BIOME_CONFIG_FILE_NAME}. Skipping VCS integration.`,
    );
    return;
  }

  const existingVcs = biomeConfigContent.vcs ?? {};

  biomeConfigContent.vcs = {
    ...existingVcs,
    clientKind: existingVcs.clientKind ?? "git",
    enabled: true,
    useIgnoreFile: true,
  };

  FileService.putFileContent(
    biomeConfigFilePath,
    `${JSON.stringify(biomeConfigContent, null, 2)}
`,
  );
}

function migrateCommonViteStarterFiles(absoluteProjectDir: string): void {
  updateFileContent(
    join(absoluteProjectDir, "src", "main.ts"),
    migrateViteVanillaTsMainFile,
  );
  updateFileContent(
    join(absoluteProjectDir, "src", "main.tsx"),
    migrateViteReactTsMainFile,
  );
  updateFileContent(
    join(absoluteProjectDir, "src", "App.tsx"),
    migrateViteReactTsAppFile,
  );
}

function updateFileContent(
  filePath: string,
  updateContent: (content: string) => string,
): void {
  if (!FileService.fileExists(filePath)) {
    return;
  }

  const content = FileService.getFileContent(filePath);
  const updatedContent = updateContent(content);

  if (updatedContent === content) {
    return;
  }

  FileService.putFileContent(filePath, updatedContent);
}

function migrateViteVanillaTsMainFile(content: string): string {
  return replaceExactPattern(
    replaceExactPattern(
      content,
      VITE_VANILLA_APP_ELEMENT_PATTERN,
      VITE_VANILLA_APP_ELEMENT_REPLACEMENT,
    ),
    VITE_VANILLA_COUNTER_PATTERN,
    VITE_VANILLA_COUNTER_REPLACEMENT,
  );
}

function migrateViteReactTsMainFile(content: string): string {
  return replaceExactPattern(
    content,
    VITE_REACT_ROOT_PATTERN,
    VITE_REACT_ROOT_REPLACEMENT,
  );
}

function migrateViteReactTsAppFile(content: string): string {
  return replaceExactPattern(
    addRelNoopenerToBlankTargetLinks(content),
    VITE_REACT_BUTTON_PATTERN,
    VITE_REACT_BUTTON_REPLACEMENT,
  );
}

function addRelNoopenerToBlankTargetLinks(content: string): string {
  return content.replaceAll(
    /target="_blank"(?![^>]*\srel=)/g,
    'target="_blank" rel="noopener"',
  );
}

function replaceExactPattern(
  content: string,
  pattern: string,
  replacement: string,
): string {
  return content.includes(pattern)
    ? content.replace(pattern, replacement)
    : content;
}

function projectHasBiomeConfig(absoluteProjectDir: string): boolean {
  return FileService.fileExists(
    join(absoluteProjectDir, BIOME_CONFIG_FILE_NAME),
  );
}

function projectHasManagedEslintConfigFile(
  absoluteProjectDir: string,
): boolean {
  const eslintConfigFilePath = join(
    absoluteProjectDir,
    ESLINT_CONFIG_FILE_NAME,
  );
  if (!existsSync(eslintConfigFilePath)) {
    return false;
  }

  return isManagedEslintConfig(readFileSync(eslintConfigFilePath, "utf-8"));
}

function isManagedEslintConfig(eslintConfigContent: string): boolean {
  return MANAGED_ESLINT_MARKERS.some((managedMarker) =>
    eslintConfigContent.includes(managedMarker),
  );
}

function deleteManagedEslintConfig(
  absoluteProjectDir: string,
  hasManagedEslintConfig: boolean,
): void {
  if (!hasManagedEslintConfig) {
    return;
  }

  const eslintConfigFilePath = join(
    absoluteProjectDir,
    ESLINT_CONFIG_FILE_NAME,
  );
  if (!existsSync(eslintConfigFilePath)) {
    return;
  }

  unlinkSync(eslintConfigFilePath);
}

function updateManagedPreCommitHook(absoluteProjectDir: string): void {
  GitService.updateGitHook(
    absoluteProjectDir,
    PRE_COMMIT_HOOK_NAME,
    OLD_PRE_COMMIT_COMMAND,
    NEW_PRE_COMMIT_COMMAND,
  );
}
