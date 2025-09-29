[![Homepage](https://repository-images.githubusercontent.com/306680259/8d077b80-19cd-11eb-8625-f2b1a474d4a9)](https://escemi-tech.github.io/ts-dev-tools/)

[![npm](https://img.shields.io/npm/v/@ts-dev-tools/core)](https://www.npmjs.com/package/@ts-dev-tools/core) [![Continuous integration](https://github.com/escemi-tech/ts-dev-tools/workflows/Continuous%20Integration/badge.svg)](https://github.com/escemi-tech/ts-dev-tools/actions?query=workflow%3A%22Continuous+Integration%22) [![](https://codecov.io/gh/escemi-tech/ts-dev-tools/branch/main/graph/badge.svg?token=mVB3P7BFzR)](https://codecov.io/gh/escemi-tech/ts-dev-tools) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING) [![Sponsor](https://img.shields.io/badge/%E2%9D%A4-Sponsor-ff69b4)](https://github.com/sponsors/neilime) [![GitHub stars](https://img.shields.io/github/stars/escemi-tech/ts-dev-tools?logo=github)](https://github.com/escemi-tech/ts-dev-tools)

# Welcome to @ts-dev-tools/core 💎

## Common Typescript dev tools

---

## What's included

### 📦 Package scripts

- `test`: Run tests with [Vitest](https://vitest.dev/)
- `format`: Format code with [Biome](https://biomejs.dev/)
- `lint`: Run linter with [Biome](https://biomejs.dev/)
- `check`: Run Biome checks and apply safe fixes
- `prepare`: Self install / update

### ⚡ Git hooks

#### `pre-commit`

- Run [Biome](https://biomejs.dev/) checks against staged git files

#### `commit-msg`

- Lint [conventional commit](https://github.com/conventional-changelog/commitlint/tree/master/@commitlint/config-conventional) message with [commit-lint](https://conventional-changelog.github.io/commitlint/)

#### `pre-push`

- Run linter
- Execute Typescript compiler with [tsc](https://www.typescriptlang.org/docs/handbook/compiler-options.html)
- Run tests

### 👕 Code quality

- Install and configure [Biome](https://biomejs.dev/) for linting and formatting
- Enable Biome recommended rules and VCS integration
- Organize imports with Biome assist actions

### 🧪 Tests

- Install and configure [Vitest](https://vitest.dev/)
- Install and configure [@vitest/coverage-v8](https://www.npmjs.com/package/@vitest/coverage-v8) for coverage reports

### 📖 Types

- [@types/node](https://www.npmjs.com/package/@types/node)
- [vitest/globals](https://vitest.dev/config/#globals)

---

## Usage

### _1_. Install

```sh
npm install --save-dev @ts-dev-tools/core
```

Or

```sh
pnpm add -D @ts-dev-tools/core
```

Or

```sh
yarn add --dev @ts-dev-tools/core
```

### _2_. Enable ts-dev-tools

```sh
npm exec ts-dev-tools install
```

Or

```sh
pnpm ts-dev-tools install
```

Or

```sh
yarn ts-dev-tools install
```

⚠️ If your package is using yarn, is not private and you're publishing it on a registry like npmjs.com, you need to disable postinstall script using [pinst](https://github.com/typicode/pinst). Otherwise, postinstall will run when someone installs your package and result in an error.
