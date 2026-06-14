⚠️ **WARNING: THIS LIBRARY IS STILL IN DEVELOPMENT** ⚠️

---

<img src="r-machine.logo.svg" width="158px" align="center" alt="R-Machine logo" />

# rforge — Command-line interface for R-Machine

[![NPM Version](https://img.shields.io/npm/v/rforge?label=latest)](https://www.npmjs.com/package/rforge)
[![R-Machine CI status](https://github.com/codecarvings/r-machine/actions/workflows/ci.yml/badge.svg?event=push&branch=main)](https://github.com/codecarvings/r-machine/actions/workflows/ci.yml?query=branch%3Amain)

---

The `rforge` CLI is the companion tool for [R-Machine](https://rmachine.dev) —
intended to provide scaffolding, diagnostics, and LLM-agent skill generation for
projects that use R-Machine.

> 🌱 **Early development.** `rforge` is the newest, least complete R-Machine
> package. **Today it ships a single command — [`rforge skill`](#rforge-skill)** —
> while the rest of the toolbox (scaffolding, diagnostics) is still on the roadmap.
> Expect the command surface to grow and change.

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

## Commands

### `rforge skill`

Installs the R-Machine **LLM-agent Skill** into your project so AI coding agents
(Claude Code and others) know how to scaffold and extend R-Machine resources
correctly.

```sh
rforge skill [--out <dir>] [--force]
```

| Flag          | Default            | Description                                                             |
| ------------- | ------------------ | ----------------------------------------------------------------------- |
| `--out <dir>` | `./.claude/skills` | Skills directory to install into. The Skill lands in `<out>/r-machine`. |
| `--force`     | `false`            | Overwrite an existing Skill at the destination.                         |

Commit the installed folder to share it with your team; re-run with `--force` to
refresh it after upgrading `rforge`.

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
