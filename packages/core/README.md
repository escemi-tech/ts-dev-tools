[![Homepage](https://repository-images.githubusercontent.com/306680259/8d077b80-19cd-11eb-8625-f2b1a474d4a9)](https://escemi-tech.github.io/ts-dev-tools/)

[![npm](https://img.shields.io/npm/v/@ts-dev-tools/core)](https://www.npmjs.com/package/@ts-dev-tools/core) [![Continuous integration](https://github.com/escemi-tech/ts-dev-tools/workflows/Continuous%20Integration/badge.svg)](https://github.com/escemi-tech/ts-dev-tools/actions?query=workflow%3A%22Continuous+Integration%22) [![](https://codecov.io/gh/escemi-tech/ts-dev-tools/branch/main/graph/badge.svg?token=mVB3P7BFzR)](https://codecov.io/gh/escemi-tech/ts-dev-tools) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING) [![Sponsor](https://img.shields.io/badge/%E2%9D%A4-Sponsor-ff69b4)](https://github.com/sponsors/neilime) [![GitHub stars](https://img.shields.io/github/stars/escemi-tech/ts-dev-tools?logo=github)](https://github.com/escemi-tech/ts-dev-tools)

# Welcome to @ts-dev-tools/core 💎

## Common Typescript dev tools

---

## What's included

### 📦 Package scripts

- `test`: Run tests with [jest](https://jestjs.io/)
- `lint`: Run linter with [eslint](https://eslint.org/)
- `postinstall`: Self update

### ⚡ Git hooks

- Install and configure [husky](https://typicode.github.io/husky)

#### `pre-commit`

- Execute Typescript compiler with [tsc](https://www.typescriptlang.org/docs/handbook/compiler-options.html)
- Run linter against staged git files with [lint-staged](https://github.com/okonet/lint-staged)
- Run prettier against changed files with [pretty-quick](https://github.com/azz/pretty-quick#readme)

#### `commit-msg`

- Lint [conventional commit](https://github.com/conventional-changelog/commitlint/tree/master/@commitlint/config-conventional) message with [commit-lint](https://conventional-changelog.github.io/commitlint/)

#### `pre-push`

- Run linter
- Run tests

### 👕 Linter

- Install and configure [eslint](https://eslint.org/) with recommended [rules](https://eslint.org/docs/rules/)
- Configure Eslint to works with [typescript](https://github.com/typescript-eslint/typescript-eslint#readme)
- Install and configure the following Eslint plugins:

  - [eslint-plugin-import](https://github.com/benmosher/eslint-plugin-import): ES2015+ (ES6+) import/export syntax
  - [eslint-plugin-jest](https://github.com/jest-community/eslint-plugin-jest#readme): Rules for Jest
  - [eslint-plugin-node](https://github.com/mysticatea/eslint-plugin-node#readme): Additional ESLint's rules for Node.js
  - [eslint-plugin-promise](https://github.com/xjamundx/eslint-plugin-promise#readme): Enforce best practices for JavaScript promises.

### 💄 Prettier

- Install and configure [Prettier](https://prettier.io/)
- Configure Prettier to works with [Eslint](https://github.com/prettier/eslint-config-prettier)
- Install and configure the following Prettier plugins:
  - [prettier-plugin-import-sort](https://github.com/ggascoigne/prettier-plugin-import-sort#readme): sort imports using [import-sort](https://github.com/renke/import-sort) for javascript and typescript files.

### 🧪 Tests

- Install and configure [Jest](https://jestjs.io/)
- Install and configure [ts-jest](https://kulshekhar.github.io/ts-jest) to make Jest and Typescript work together

### 📖 Types

- [@types/node](https://www.npmjs.com/package/@types/node)
- [@types/jest](https://www.npmjs.com/package/@types/jest)

---

## Usage

### _1_. Install

```sh
npm install --dev @ts-dev-tools/core
```

Or

```sh
yarn add --dev @ts-dev-tools/core
```

### _2_. Enable ts-dev-tools

```sh
npx ts-dev-tools install
```

Or

```sh
yarn ts-dev-tools install
```

⚠️ If your package is not private and you're publishing it on a registry like npmjs.com, you need to disable postinstall script using [pinst](https://github.com/typicode/pinst). Otherwise, postinstall will run when someone installs your package and result in an error.
