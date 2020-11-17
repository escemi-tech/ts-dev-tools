import { updatePackageJson } from "@ts-dev-tools/core/dist/services/packageJson";

export function up(absoluteProjectDir: string): void {
  const eslintConfig = {
    env: {
      browser: true,
    },
    extends: ["plugin:react/recommended"],
  };

  const jest = {
    testEnvironment: "jsdom",
  };

  updatePackageJson(absoluteProjectDir, {
    eslintConfig,
    jest,
  });
}
