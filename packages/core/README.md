<p align="center">
  <a href="https://github.com/escemi-tech/ts-dev-tools/tree/main/packages/core" target="_blank"><img src="https://repository-images.githubusercontent.com/306680259/8d077b80-19cd-11eb-8625-f2b1a474d4a9" width="600"></a>
</p>
<p align="center">
<a href="https://www.npmjs.com/package/@ts-dev-tools/core" target="_blank"><img alt="npm" src="https://img.shields.io/npm/v/@ts-dev-tools/core"></a>
<a href="https://github.com/escemi-tech/ts-dev-tools/actions?query=workflow%3A%22Continuous+Integration%22" target="_blank"><img alt="Continuous integration" src="https://github.com/escemi-tech/ts-dev-tools/workflows/Continuous%20Integration/badge.svg"></a>
<a href="https://codecov.io/gh/escemi-tech/ts-dev-tools" target="_blank"><img src="https://codecov.io/gh/escemi-tech/ts-dev-tools/branch/main/graph/badge.svg?token=mVB3P7BFzR"/></a>    
<a href="CONTRIBUTING" target="_blank"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome"></a>
<a href="https://github.com/sponsors/neilime"><img src="https://img.shields.io/badge/%E2%9D%A4-Sponsor-ff69b4" alt="Sponsor"></a>
<a href="https://github.com/escemi-tech/ts-dev-tools"><img alt="GitHub stars" src="https://img.shields.io/github/stars/escemi-tech/ts-dev-tools?logo=github">
</p>
<h1 align="center">Welcome to @ts-dev-tools/core 💎</h1>

<h2 align="center">Common Typescript dev tools</h2>

---

## 🏠 [Homepage](https://github.com/escemi-tech/ts-dev-tools/tree/main/packages/core)

<br>

---

<br>

## What's included

<br>

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

<br>

---

<br>

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

---

<br>

## Author

<br>

👤 **Escemi <contact@escemi.com>**

- Website: https://www.escemi.com
- LinkedIn: [@https:\/\/www.linkedin.com\/company\/escemi](https://linkedin.com/in/https://www.linkedin.com/company/escemi)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/escemi-tech/ts-dev-tools/issues). You can also take a look at the [contributing guide](CONTRIBUTING).

## Show your support

Give a ⭐️ if this project helped you!

## 📝 License

This project is [MIT](LICENSE) licensed.
