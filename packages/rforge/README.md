⚠️ **WARNING: THIS LIBRARY IS STILL IN DEVELOPMENT** ⚠️

---

<img src="r-machine.logo.svg" width="158px" align="center" alt="R-Machine logo" />

# rforge — Command-line interface for R-Machine

[![NPM Version](https://img.shields.io/npm/v/rforge?label=latest)](https://www.npmjs.com/package/rforge)
[![R-Machine CI status](https://github.com/codecarvings/r-machine/actions/workflows/ci.yml/badge.svg?event=push&branch=main)](https://github.com/codecarvings/r-machine/actions/workflows/ci.yml?query=branch%3Amain)

---

The `rforge` CLI is the companion tool for [R-Machine](https://rmachine.dev).
It provides scaffolding, diagnostics, and LLM-agent skill generation for projects that use R-Machine.

## Install

```sh
# global
npm install -g rforge
pnpm add -g rforge

# or one-off via dlx
npx rforge@latest <command>
pnpm dlx rforge@latest <command>
```

## Usage

```sh
rforge --help
rforge --version
```

> 🚧 This package is an early draft.

---

## License

`rforge` is licensed under the
[GNU Affero General Public License v3.0](./LICENSE) (AGPL-3.0-only).

This means:

- ✅ Free to use in open source projects with a compatible license
- ✅ Free to modify and distribute under the same terms
- ❌ **Cannot** be used in closed-source / proprietary software

> If you need to use `rforge` in a proprietary project,
> reach out at licensing@codecarvings.com to discuss a commercial arrangement.
