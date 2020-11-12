<p align="center">
  <a href="https://github.com/escemi-tech/ts-dev-tools/tree/main/packages/react" target="_blank"><img src="https://repository-images.githubusercontent.com/306680259/8d077b80-19cd-11eb-8625-f2b1a474d4a9" width="600"></a>
</p>
<p align="center">
  <a href="https://www.npmjs.com/package/@ts-dev-tools/react" target="_blank"><img alt="npm" src="https://img.shields.io/npm/v/@ts-dev-tools/react"></a>
  <a href="https://github.com/escemi-tech/ts-dev-tools/actions?query=workflow%3A%22Continuous+Integration%22" target="_blank"><img alt="Continuous integration" src="https://github.com/escemi-tech/ts-dev-tools/workflows/Continuous%20Integration/badge.svg"></a>
  <a href="https://codecov.io/gh/escemi-tech/ts-dev-tools" target="_blank"><img src="https://codecov.io/gh/escemi-tech/ts-dev-tools/branch/main/graph/badge.svg?token=mVB3P7BFzR"/></a>    
  <a href="CONTRIBUTING" target="_blank"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome"></a>
  <a href="https://github.com/sponsors/neilime"><img src="https://img.shields.io/badge/%E2%9D%A4-Sponsor-ff69b4" alt="Sponsor"></a>
  <a href="https://github.com/escemi-tech/ts-dev-tools"><img alt="GitHub stars" src="https://img.shields.io/github/stars/escemi-tech/ts-dev-tools?logo=github"></a>
</p>
<h1 align="center">Welcome to @ts-dev-tools/react ⚛️</h1>

<h2 align="center">Typescript dev tools for a <a href="https://reactjs.org/">ReactJS</a> project</h2>

---

<br>

## 🏠 [Homepage](https://github.com/escemi-tech/ts-dev-tools/tree/main/packages/react)

<br>

---

<br>

## What's included

<br>

### Inherit from [@ts-dev-tools/core](https://github.com/escemi-tech/ts-dev-tools/tree/main/packages/)

<br>

### 👕 Linter

- Enable `browser` env for [eslint](https://eslint.org/docs/user-guide/configuring#specifying-environments)
- Install and configure [eslint-plugin-react](https://github.com/yannickcr/eslint-plugin-react)

### 🧪 Tests

- Install react tests libraries:
  - [@testing-library/jest-dom](https://testing-library.com/docs/ecosystem-jest-dom): Custom jest matchers to test the state of the DOM
  - [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/): Simple and complete React DOM testing utilities
  - [@testing-library/react-hooks](https://react-hooks-testing-library.com/): Simple and complete React hooks testing utilities

### 📖 Types

- [@types/react](https://www.npmjs.com/package/@types/react)
- [@types/react-dom](https://www.npmjs.com/package/@types/react-dom)

<br>

---

<br>

## Usage

### _1_. Install

```sh
npm install --dev @ts-dev-tools/react
```

Or

```sh
yarn add --dev @ts-dev-tools/react
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
