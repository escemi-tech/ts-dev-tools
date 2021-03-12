import { PackageJson } from "@ts-dev-tools/core/dist/services/PackageJson";

export function up(absoluteProjectDir: string): void {
  const eslintConfig = {
    env: {
      browser: true,
    },
    extends: ["plugin:react/recommended", "prettier/react"],
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
    },
  };

  const jest = {
    testEnvironment: "jsdom",
  };

  PackageJson.fromDirPath(absoluteProjectDir).merge({
    eslintConfig,
    jest,
  });
}
