# Contributing to R-Machine

R-Machine is open to external contributions. Thank you for considering one.

## Before you write code

R-Machine is a strongly opinionated design, and much of what looks like an
omission is deliberate. For anything beyond a typo or an obvious bug fix,
**open an issue first** — a short conversation costs you far less than a pull
request that gets turned down on grounds you had no way to guess.

Two documents carry the reasoning, and reading them will answer most "why is it
like this?" questions:

- [`AGENTS.md`](AGENTS.md) — repository mechanics that are not guessable from the
  tree: the `@r-machine/source` condition, the barrel/import layout, code style,
  the release flow.
- [`TESTING.md`](TESTING.md) — the test standard. **Read it before writing a
  test.**

Contributions that are almost always welcome: a failing test that pins down a
bug, a clearer error message, documentation and Skill corrections, an example
that stops working.

## The Contributor License Agreement

Your first pull request will get a bot comment asking you to accept the
[CLA](CLA.md). Reply on the pull request with exactly:

```
I have read the CLA Document and I hereby sign the CLA
```

In short: you keep the copyright in your work, you grant a licence broad enough
that the project can be relicensed or transferred, and in exchange the packages
carrying your contribution are committed to staying available under an
OSI-approved open source licence. You are asked once, not per pull request.

## Setup

Node **>= 20.9** (CI runs 24) and pnpm — the version is pinned in
`packageManager`, so `corepack enable` gets you the right one.

```bash
pnpm install
pnpm test          # the gate: runtime and type tests, all five packages
pnpm check         # Biome format + lint, writing
```

For the inner loop, `pnpm vitest run <path-fragment>` from the repository root
runs a single file. Validate with the full `pnpm test` before you push: a scoped
`vitest --typecheck` run is not reliable.

## What CI enforces

The "Build, Test and Check" job on your pull request is the sole gate, and
`main` requires it to pass with the branch up to date. It runs `pnpm build`,
`pnpm test:coverage`, `pnpm test:e2e` and `pnpm check:dry`.

Two things catch people out:

- **Coverage is a global 100% gate with `all: true`.** A new source file with no
  test fails CI at 0% — it does not slip through. Every `/* v8 ignore */` needs
  an inline justification.
- **`pnpm check:dry` fails on any formatting drift.** Run `pnpm check` before you
  push; the CI variant does not write.

## Changesets

Any change under `packages/*` that a consumer could notice needs a changeset:

```bash
pnpm changeset
```

Write it for the person reading the changelog, not for the reviewer: what
changed, why, and what they have to do about it. Put it at the top level of
`.changeset/` — which is where `pnpm changeset` puts it. Never run
`changeset version` yourself; that is CI's job.

Purely internal changes — a refactor with no observable effect, a test, a repo
script — do not need one.

## Commits and pull requests

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org):
`type(scope): imperative summary`. Use the scope to group an initiative
(`core`, `next`, `react`, `testing`, `skill`, `repo`, `deps`); do not prefix the
subject with a branch name. Nothing enforces this — it is convention.

Keep the pull request focused on one thing. A large mechanical change (a rename,
a formatting pass) is much easier to review as its own commit than mixed into
behaviour.

## The Skill and the docs are product surface

`packages/rforge/skill/` and `docs/` are how projects and LLM agents adopt
R-Machine, and they are held to the same standard as the TypeScript. If you
change behaviour that they describe, update them in the same pull request — and
**verify every claim against `examples/`**. A pattern no example exercises is a
hypothesis, not documentation.

## Reporting bugs and requesting features

[Open an issue](https://github.com/codecarvings/r-machine/issues) with as much
detail as you can: version, framework and strategy in use, and a minimal
reproduction. A reproduction as a failing test against `examples/` is the fastest
possible route to a fix.

For anything security-related, do **not** open a public issue — see
[`SECURITY.md`](SECURITY.md).

## Code of Conduct

Participation is governed by the [Code of Conduct](CODE_OF_CONDUCT.md).
