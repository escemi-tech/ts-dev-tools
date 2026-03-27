import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { FileService } from "../../services/FileService";
import { GitService } from "../../services/GitService";
import { PackageJson } from "../../services/PackageJson";
import {
  createProjectForTestFile,
  deleteTestProject,
} from "../../tests/test-project";
import { up } from "./20260311120000-migrate-to-biome";

const OLD_PRE_COMMIT_COMMAND =
  "npx --no-install lint-staged && npx --no-install pretty-quick --staged";

// Set to false to avoid using the cache
const useCache = true;
// Set to false to inspect the test project directory after the test
const shouldCleanupAfterTest = true;

describe("Migration 20260311120000-migrate-to-biome", () => {
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
    it("should migrate ts-dev-tools eslint and prettier setup to biome", async () => {
      const packageJson = PackageJson.fromDirPath(testProjectDir);
      packageJson.merge({
        scripts: {
          format: "prettier --cache --write '**/*.ts'",
          lint: 'eslint "src/**/*.{ts,tsx}"',
        },
        prettier: {
          semi: true,
          printWidth: 100,
          trailingComma: "es5",
          plugins: ["@prettier/plugin-oxc"],
        },
        "lint-staged": {
          "*.{js,ts,tsx}": ["eslint --fix"],
        },
        importSort: {
          ".js, .jsx, .ts, .tsx": {
            style: "module",
          },
        },
      });

      const eslintConfigFilePath = join(testProjectDir, "eslint.config.mjs");
      FileService.putFileContent(
        eslintConfigFilePath,
        `const tsDevToolsCore = [];
      export default tsDevToolsCore;
      `,
      );

      const preCommitHookPath = join(
        testProjectDir,
        ".git",
        "hooks",
        "pre-commit",
      );
      writeFileSync(
        preCommitHookPath,
        GitService.GIT_HOOK_TEMPLATE.replace(
          "%gitHookCommand%",
          OLD_PRE_COMMIT_COMMAND,
        ),
      );

      await up(testProjectDir);

      expect(
        PackageJson.fromDirPath(testProjectDir).getContent(),
      ).toMatchSnapshot();

      const biomeConfigFilePath = join(testProjectDir, "biome.json");
      expect(FileService.fileExists(biomeConfigFilePath)).toBe(true);
      expect(FileService.getFileContent(biomeConfigFilePath)).toMatchSnapshot();

      expect(existsSync(eslintConfigFilePath)).toBe(false);
      expect(readFileSync(preCommitHookPath, "utf-8")).toMatchSnapshot();
    });

    it("should keep custom eslint config files", async () => {
      const eslintConfigFilePath = join(testProjectDir, "eslint.config.mjs");
      const customEslintConfig =
        "export default [{ rules: { semi: ['error', 'always'] } }];\n";
      FileService.putFileContent(eslintConfigFilePath, customEslintConfig);

      await up(testProjectDir);

      const biomeConfigFilePath = join(testProjectDir, "biome.json");
      expect(FileService.fileExists(biomeConfigFilePath)).toBe(true);

      expect(FileService.getFileContent(eslintConfigFilePath)).toBe(
        customEslintConfig,
      );
    });

    it("should migrate managed package.json eslint config without eslint packages", async () => {
      const packageJson = PackageJson.fromDirPath(testProjectDir);
      packageJson.merge({
        eslintConfig: {
          root: true,
          parser: "@typescript-eslint/parser",
          plugins: ["@typescript-eslint", "jest"],
          extends: [
            "eslint:recommended",
            "plugin:@typescript-eslint/recommended",
            "plugin:jest/recommended",
            "prettier",
          ],
          env: {
            es2021: true,
          },
          parserOptions: {
            ecmaFeatures: {
              jsx: true,
            },
            ecmaVersion: 12,
            sourceType: "module",
          },
          settings: {
            jest: {
              version: "detect",
            },
          },
        },
      });

      await expect(up(testProjectDir)).resolves.toBeUndefined();

      const migratedPackageJson =
        PackageJson.fromDirPath(testProjectDir).getContent();
      expect(migratedPackageJson.eslintConfig).toBeUndefined();
      expect(migratedPackageJson.scripts).toMatchObject({
        check: "biome check --write .",
        format: "biome format --write .",
        lint: "biome lint .",
      });
    });

    it("should not overwrite an existing biome config", async () => {
      const biomeConfigFilePath = join(testProjectDir, "biome.json");
      const existingBiomeConfig =
        '{\n  "vcs": {\n    "enabled": false\n  }\n}\n';
      FileService.putFileContent(biomeConfigFilePath, existingBiomeConfig);

      await up(testProjectDir);

      expect(FileService.getFileContent(biomeConfigFilePath)).toMatchSnapshot();
    });

    it("should migrate the common vite vanilla-ts starter to biome-compatible code", async () => {
      const sourceDirPath = join(testProjectDir, "src");
      mkdirSync(sourceDirPath, { recursive: true });

      const mainFilePath = join(sourceDirPath, "main.ts");
      FileService.putFileContent(
        mainFilePath,
        [
          "import './style.css'",
          "import typescriptLogo from './typescript.svg'",
          "import viteLogo from '/vite.svg'",
          "import { setupCounter } from './counter.ts'",
          "",
          "document.querySelector<HTMLDivElement>('#app')!.innerHTML = `",
          "  <div>",
          '    <button id="counter" type="button"></button>',
          "  </div>",
          "`",
          "",
          "setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)",
          "",
        ].join("\n"),
      );

      await up(testProjectDir);

      expect(FileService.getFileContent(mainFilePath)).toBe(
        [
          "import './style.css'",
          "import typescriptLogo from './typescript.svg'",
          "import viteLogo from '/vite.svg'",
          "import { setupCounter } from './counter.ts'",
          "",
          'const appElement = document.querySelector<HTMLDivElement>("#app");',
          "",
          "if (!appElement) {",
          '  throw new Error("Could not find #app element");',
          "}",
          "",
          "appElement.innerHTML = `",
          "  <div>",
          '    <button id="counter" type="button"></button>',
          "  </div>",
          "`",
          "",
          'const counterElement = document.querySelector<HTMLButtonElement>("#counter");',
          "",
          "if (!counterElement) {",
          '  throw new Error("Could not find #counter element");',
          "}",
          "",
          "setupCounter(counterElement)",
          "",
        ].join("\n"),
      );
    });

    it("should migrate the common vite react-ts starter to biome-compatible code", async () => {
      const sourceDirPath = join(testProjectDir, "src");
      mkdirSync(sourceDirPath, { recursive: true });

      const mainFilePath = join(sourceDirPath, "main.tsx");
      FileService.putFileContent(
        mainFilePath,
        [
          "import { StrictMode } from 'react'",
          "import { createRoot } from 'react-dom/client'",
          "import './index.css'",
          "import App from './App.tsx'",
          "",
          "createRoot(document.getElementById('root')!).render(",
          "  <StrictMode>",
          "    <App />",
          "  </StrictMode>,",
          ")",
          "",
        ].join("\n"),
      );

      const appFilePath = join(sourceDirPath, "App.tsx");
      FileService.putFileContent(
        appFilePath,
        [
          "function App() {",
          "  return (",
          "    <>",
          '      <a href="https://vite.dev" target="_blank">',
          "        Vite",
          "      </a>",
          '      <a href="https://react.dev" target="_blank">',
          "        React",
          "      </a>",
          "      <button onClick={() => {}}>count is 0</button>",
          "    </>",
          "  )",
          "}",
          "",
          "export default App",
          "",
        ].join("\n"),
      );

      await up(testProjectDir);

      expect(FileService.getFileContent(mainFilePath)).toBe(
        [
          "import { StrictMode } from 'react'",
          "import { createRoot } from 'react-dom/client'",
          "import './index.css'",
          "import App from './App.tsx'",
          "",
          'const rootElement = document.getElementById("root");',
          "",
          "if (!rootElement) {",
          '  throw new Error("Could not find #root element");',
          "}",
          "",
          "createRoot(rootElement).render(",
          "  <StrictMode>",
          "    <App />",
          "  </StrictMode>,",
          ")",
          "",
        ].join("\n"),
      );

      expect(FileService.getFileContent(appFilePath)).toBe(
        [
          "function App() {",
          "  return (",
          "    <>",
          '      <a href="https://vite.dev" target="_blank" rel="noopener">',
          "        Vite",
          "      </a>",
          '      <a href="https://react.dev" target="_blank" rel="noopener">',
          "        React",
          "      </a>",
          '      <button type="button" onClick={() => {}}>count is 0</button>',
          "    </>",
          "  )",
          "}",
          "",
          "export default App",
          "",
        ].join("\n"),
      );
    });
  });
});
