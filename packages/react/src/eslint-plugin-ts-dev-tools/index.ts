import { default as tsDevToolsCore } from "@ts-dev-tools/core/dist/eslint-plugin-ts-dev-tools/index.js";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const reactPlugin = require("eslint-plugin-react");

export default [
  ...tsDevToolsCore,
  {
    ...reactPlugin.configs.flat.recommended,
    settings: {
      ...reactPlugin.configs.flat.recommended?.settings,
      react: {
        ...reactPlugin.configs.flat.recommended?.settings?.react,
        version: "detect",
      },
    },
  },
];
