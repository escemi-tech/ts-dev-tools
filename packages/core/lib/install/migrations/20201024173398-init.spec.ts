import { readPackageJson } from "../../services/packageJson";
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

    it("should apply migration", () => {
      up(testProjectDir);

      const packageJson = readPackageJson(testProjectDir);

      expect(packageJson).toMatchObject({
        eslintConfig: {
          env: {
            browser: true,
            es2021: true,
          },
          extends: ["eslint:recommended", "prettier"],
          parser: "@typescript-eslint/parser",
          parserOptions: {
            ecmaFeatures: {
              jsx: true,
            },
            ecmaVersion: 12,
            sourceType: "module",
          },
          plugins: ["jest", "@typescript-eslint"],
          rules: {},
        },
        prettier: {
          semi: true,
          printWidth: 100,
          trailingComma: "es5",
        },
        husky: {
          hooks: {
            "pre-commit": "tsc && lint-staged && pretty-quick --staged",
            "pre-push": "yarn lint && yarn test",
          },
        },
        "lint-staged": {
          "*.{js,ts,tsx}": ["eslint --fix"],
        },
        importSort: {
          ".js, .jsx, .ts, .tsx": {
            style: "module",
          },
        },
        scripts: {
          lint: 'eslint "lib/**/*.{ts,tsx}"',
        },
      });
    });
  });
});
