import { PackageJson } from "@ts-dev-tools/core/dist/services/PackageJson";

export async function up(absoluteProjectDir: string): Promise<void> {
  const eslintConfig = {
    env: {
      browser: true,
    },
    extends: ["plugin:react/recommended"],
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
