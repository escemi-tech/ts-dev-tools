import { PackageJson } from "@ts-dev-tools/core/dist/services/PackageJson";
import { PackageJsonMerge } from "@ts-dev-tools/core/dist/services/PackageJsonMerge";

export async function up(absoluteProjectDir: string): Promise<void> {
  const eslintConfig = {
    env: {
      browser: true,
    },
    extends: [],
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

  const packageJson = PackageJson.fromDirPath(absoluteProjectDir);
  const content = PackageJsonMerge.merge(packageJson.getContent(), {
    eslintConfig,
    jest,
  });

  const extendsPlugin = "plugin:react/recommended";
  const eslintConfigExtends = (content?.eslintConfig as { extends: string[] }).extends;

  const prettierIndex = eslintConfigExtends.indexOf("prettier");

  if (prettierIndex >= 0) {
    eslintConfigExtends.splice(prettierIndex, 0, extendsPlugin);
  } else {
    eslintConfigExtends.push(extendsPlugin);
  }

  packageJson.setContent(content);
}
