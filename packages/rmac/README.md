⚠️ **WARNING: THIS LIBRARY IS STILL IN DEVELOPMENT** ⚠️

---

<img src="r-machine.logo.svg" width="158px" align="center" alt="R-Machine logo" />

# rmac — Command-line interface for R-Machine

[![NPM Version](https://img.shields.io/npm/v/rmac?label=latest)](https://www.npmjs.com/package/rmac)
[![R-Machine CI status](https://github.com/codecarvings/r-machine/actions/workflows/ci.yml/badge.svg?event=push&branch=main)](https://github.com/codecarvings/r-machine/actions/workflows/ci.yml?query=branch%3Amain)

---

The `rmac` CLI is the companion tool for [R-Machine](https://rmachine.dev).
It provides scaffolding, diagnostics, and LLM-agent skill generation for projects that use R-Machine.

## Install

```sh
# global
npm install -g rmac
pnpm add -g rmac

# or one-off via dlx
npx rmac@latest <command>
pnpm dlx rmac@latest <command>
```

## Usage

```sh
rmac --help
rmac --version
```

> 🚧 This package is an early draft.

---

## License

`rmac` is licensed under the
[GNU Affero General Public License v3.0](./LICENSE) (AGPL-3.0-only).

This means:

- ✅ Free to use in open source projects with a compatible license
- ✅ Free to modify and distribute under the same terms
- ❌ **Cannot** be used in closed-source / proprietary software

> If you need to use `rmac` in a proprietary project,
> reach out at licensing@codecarvings.com to discuss a commercial arrangement.
