import { updatePackageJson } from "@ts-dev-tools/core/dist/services/packageJson";

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

  updatePackageJson(absoluteProjectDir, {
    eslintConfig,
    jest,
  });
}
