[![Homepage](https://repository-images.githubusercontent.com/306680259/8d077b80-19cd-11eb-8625-f2b1a474d4a9)](https://escemi-tech.github.io/ts-dev-tools/)

[![npm](https://img.shields.io/npm/v/@ts-dev-tools/core)](https://www.npmjs.com/package/@ts-dev-tools/core) [![Continuous integration](https://github.com/escemi-tech/ts-dev-tools/workflows/Continuous%20Integration/badge.svg)](https://github.com/escemi-tech/ts-dev-tools/actions?query=workflow%3A%22Continuous+Integration%22) [![](https://codecov.io/gh/escemi-tech/ts-dev-tools/branch/main/graph/badge.svg?token=mVB3P7BFzR)](https://codecov.io/gh/escemi-tech/ts-dev-tools) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING) [![Sponsor](https://img.shields.io/badge/%E2%9D%A4-Sponsor-ff69b4)](https://github.com/sponsors/neilime) [![GitHub stars](https://img.shields.io/github/stars/escemi-tech/ts-dev-tools?logo=github)](https://github.com/escemi-tech/ts-dev-tools)

# Welcome to @ts-dev-tools/react ⚛️

## Typescript dev tools for a [ReactJS](https://reactjs.org/) project

---

## What's included

### Inherit from [`@ts-dev-tools/core`](https://github.com/escemi-tech/ts-dev-tools/tree/main/packages/)

### 👕 Linter

- Enable `browser` env for [eslint](https://eslint.org/docs/user-guide/configuring#specifying-environments)
- Install and configure [eslint-plugin-react](https://github.com/yannickcr/eslint-plugin-react)

### 🧪 Tests

- Install react tests libraries:
  - [@testing-library/jest-dom](https://testing-library.com/docs/ecosystem-jest-dom): Custom jest matchers to test the state of the DOM
  - [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/): Simple and complete React DOM testing utilities
  - [@testing-library/react-hooks](https://react-hooks-testing-library.com/): Simple and complete React hooks testing utilities
  - [react-test-renderer](https://www.npmjs.com/package/react-test-renderer/): React renderer required by `@testing-library/react-hooks`

### 📖 Types

- [@types/react](https://www.npmjs.com/package/@types/react)
- [@types/react-dom](https://www.npmjs.com/package/@types/react-dom)

---

## Usage

### _1_. Install

```sh
npm install --save-dev @ts-dev-tools/react
```

Or

```sh
yarn add --dev @ts-dev-tools/react
```

### _2_. Enable ts-dev-tools

```sh
npm exec ts-dev-tools install
```

Or

```sh
yarn ts-dev-tools install
```

⚠️ If your package is using yarn, is not private and you're publishing it on a registry like npmjs.com, you need to disable postinstall script using [pinst](https://github.com/typicode/pinst). Otherwise, postinstall will run when someone installs your package and result in an error.
