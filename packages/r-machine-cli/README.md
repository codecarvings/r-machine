⚠️ **WARNING: THIS LIBRARY IS STILL IN DEVELOPMENT** ⚠️

---

<img src="r-machine.logo.svg" width="158px" align="center" alt="R-Machine logo" />

# rmachine — Command-line interface for R-Machine

[![NPM Version](https://img.shields.io/npm/v/rmachine?label=latest)](https://www.npmjs.com/package/rmachine)
[![R-Machine CI status](https://github.com/codecarvings/r-machine/actions/workflows/ci.yml/badge.svg?event=push&branch=main)](https://github.com/codecarvings/r-machine/actions/workflows/ci.yml?query=branch%3Amain)

---

The `rmachine` CLI is the companion tool for [R-Machine](https://r-machine.codecarvings.com).
It provides scaffolding, diagnostics, and LLM-agent skill generation for projects that use R-Machine.

## Install

```sh
# global
pnpm add -g rmachine

# or one-off via dlx
pnpm dlx rmachine <command>
```

## Usage

```sh
rmachine --help
rmachine --version

rmachine skill              # generate the LLM-agent Skill in ./.claude/skills
rmachine skill --out <dir>  # generate into a custom directory
```

> 🚧 This package is an early draft. Commands beyond `--version` / `--help`
> currently print placeholder output.

## License

`rmachine` is licensed under the
[GNU Affero General Public License v3.0](./LICENSE) (AGPL-3.0-only).

This means:

- ✅ Free to use in open source projects with a compatible license
- ✅ Free to modify and distribute under the same terms
- ❌ **Cannot** be used in closed-source / proprietary software

> If you need to use `rmachine` in a proprietary project,
> reach out at licensing@codecarvings.com to discuss a commercial arrangement.
