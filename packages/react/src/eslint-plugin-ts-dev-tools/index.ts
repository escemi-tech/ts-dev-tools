// Must be duplicated "packages/react/eslint.config.mjs"

import tsDevToolsCore from "@ts-dev-tools/core/dist/eslint-plugin-ts-dev-tools";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const reactRecommended = require("eslint-plugin-react/configs/recommended");

export default [...tsDevToolsCore, reactRecommended];
