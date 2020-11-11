<p align="center">
  <a href="https://github.com/escemi-tech/ts-dev-tools" target="_blank"><img src="https://repository-images.githubusercontent.com/306680259/8d077b80-19cd-11eb-8625-f2b1a474d4a9" width="600"></a>
</p>
<p>
<p align="center">
<a href="https://www.npmjs.com/search?q=%40ts-dev-tools" target="_blank"><img alt="npm" src="https://img.shields.io/npm/v/@ts-dev-tools/core"></a>
<a href="https://github.com/escemi-tech/ts-dev-tools/actions?query=workflow%3A%22Continuous+Integration%22" target="_blank"><img alt="Continuous integration" src="https://github.com/escemi-tech/ts-dev-tools/workflows/Continuous%20Integration/badge.svg"></a>
<a href="https://codecov.io/gh/escemi-tech/ts-dev-tools" target="_blank"><img src="https://codecov.io/gh/escemi-tech/ts-dev-tools/branch/main/graph/badge.svg?token=mVB3P7BFzR"/></a>    
<a href="LICENSE" target="_blank"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" /></a>
<a href="CONTRIBUTING" target="_blank"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome"></a>
<a href="https://github.com/sponsors/neilime"><img src="https://img.shields.io/badge/%E2%9D%A4-Sponsor-ff69b4" alt="Sponsor"></a>
<a href="https://github.com/escemi-tech/ts-dev-tools"><img alt="GitHub stars" src="https://img.shields.io/github/stars/escemi-tech/ts-dev-tools?logo=github">
</p>
<h1 align="center">Welcome to ts-dev-tools 👋</h1>
<br>

<h2 align="center">Opinionated package to configure proper tools to develop a Typescript project</h2>

<br>

---

<br>

## 🏠 [Homepage](https://escemi-tech.github.io/ts-dev-tools/)

<br>

---

<br>
<br>

## Why **ts-dev-tools** ?

<br>

### _1_. A fine tuned collection of tools and configuration ready for a realworld project

<br>

Within the dozen of existing packages, **ts-dev-tools** uses a short list of consistent libraries and theit recommanded configuration.
**ts-dev-tools** is used by various real world projects to be run in production, so its toolset is effective and meet industry standards.

<br>

### _2_. One package to rule them all, one dependency to keep up to date

<br>

**ts-dev-tools** is [well tested](https://github.com/escemi-tech/ts-dev-tools/blob/ab7d4e6203631907c3a0e86255f6866a8a0c7c2a/README.md#L6), for each changes or dependency update. Dependencies are updated all weeks in order to keep dev tools up to date agains security issues and to give access to the latest available feature.

Using **ts-dev-tools** you should just have to update it and you'll have all the dev dependencies used by **ts-dev-tools**, up to date !

<br>

## Usage

<br>

### _1_. Choose the plugin that fits with you need

| Name                                                                                        | Description                                                                        |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [@ts-dev-tools/core](https://github.com/escemi-tech/ts-dev-tools/tree/main/packages/core)   | Common Typescript tools (Eslint and prettier, Husky, lint-staged and pretty-quick) |
| [@ts-dev-tools/react](https://github.com/escemi-tech/ts-dev-tools/tree/main/packages/react) | Dev tools for a for [ReactJS](https://reactjs.org/) project                        |

<br>

### _2_. Install

_Example with plugin `@ts-dev-tools/core`, replace `@ts-dev-tools/core` by the plugin you want to use_

```sh
npm install --dev @ts-dev-tools/core
```

Or

```sh
yarn add --dev @ts-dev-tools/core
```

### _3_. Enable ts-dev-tools

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
