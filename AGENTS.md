# R-Machine monorepo — working notes

This repository **is** R-Machine: the library, the `rforge` CLI, and the bundled
LLM Skill. It is not an application that consumes R-Machine — if the task is
"add a gear / shell / feature to an app", that is the Skill in
`packages/rforge/skill/`, which is installed into a *consumer* project with
`rforge skill`. Here you work on the library itself.

Two companion documents are the authority on their subject and are not repeated
here:

- [`README.md`](README.md) — what R-Machine is, the conceptual model, licensing.
- [`TESTING.md`](TESTING.md) — the test standard (layout, what counts as
  tautological, coverage ratchet). **Read it before writing any test.**

This file covers the rest: the mechanics that are not guessable from the tree.

---

## Layout

```
packages/
  r-machine/          # core engine        → `r-machine`
  r-machine-react/    # React bindings     → `@r-machine/react`
  r-machine-next/     # Next.js integration→ `@r-machine/next`
  r-machine-testing/  # mockPlug & co.     → `@r-machine/testing`
  rforge/             # CLI + bundled LLM Skill (`skill/`)
examples/             # 7 runnable apps — also the e2e fixtures
e2e/                  # Playwright specs — 5 projects (react + the 4 Next strategies)
benchmarks/type-scale/# tsc scaling harness (`pnpm bench:types`)
configs/              # shared tsconfig.base.json + vitest.base.ts
scripts/              # release-time helpers
docs/                 # llms.txt / llms-full.txt (published for LLM consumers)
```

Each package's `src/` is split into namespaces (`core/`, `lib/`, `errors/`,
`locale/`, `strategy/`, …), each with an `index.ts` barrel; `tests/` mirrors that
tree exactly.

---

## Commands

pnpm is the package manager (version pinned in `packageManager`); CI runs Node 24.

| Command | What it does |
| --- | --- |
| `pnpm install` | Bootstrap. |
| `pnpm test` | **The gate.** Vitest across all five packages, runtime *and* type tests. |
| `pnpm vitest run <path-fragment>` | Fast inner loop on one file, from the repo root. |
| `pnpm test:coverage` | Same, with the 100% coverage gate CI enforces. |
| `pnpm build` | Everything, `--workspace-concurrency=1` (packages before examples). |
| `pnpm build:packages` / `pnpm build:examples` | Half of the above. |
| `pnpm test:e2e` | Playwright. Requires a prior `pnpm build` — the web servers run each example's `start`/`preview`. |
| `pnpm check` | Biome format + lint, writing. `pnpm check:dry` is the CI variant that fails on drift. |
| `pnpm dev:play` | Runs the root `play.tsx` scratchpad under `tsx` with the source condition — the quickest way to poke at the API by hand. |
| `pnpm size` / `pnpm size:why` | size-limit budgets on the built entry points. |
| `pnpm changeset` | Record a release note (see below). |

Notes that save a debugging session:

- **Always validate with the full `pnpm test`.** A scoped `vitest --typecheck`
  run is unreliable for type tests; use scoped runs for iteration only.
- The e2e origin-strategy project needs `english.test` / `italiano.test` to
  resolve — Playwright handles that with `--host-resolver-rules`, so **do not
  edit `/etc/hosts`**.
- `pnpm build` builds examples too, and examples are Next/Vite apps: it is slow.
  Prefer `pnpm build:packages` when you only need fresh `dist` types.

---

## The `@r-machine/source` condition — read this before debugging any import

Every package declares its internal subpath imports (`#r-machine/core`,
`#r-machine/react/utils`, …) in `package.json` under `imports`, with three
branches: `@r-machine/source` → `./src/…/index.ts`, `types` → the built `.d.cts`,
`default` → the built `.js`. Consequences:

- The **root `tsconfig.json` sets `customConditions: ["@r-machine/source"]`**, so
  in-repo TypeScript sees *source*, never `dist`. Same for `pnpm dev`
  (`tsx --conditions @r-machine/source`).
- **Vitest must alias `#r-machine/*` to `src`.** `configs/vitest.base.ts` sets the
  resolve condition, and each package's `vitest.config.ts` adds explicit aliases —
  including, in `r-machine-react`, aliases for *sibling-package* specifiers
  (`r-machine`, `r-machine/core`, …) because the condition does not reliably
  survive `mergeConfig`. Get this wrong and a **second `plug.ts` module instance**
  loads: `getPlugResolve` returns `undefined` and the failure looks like a logic
  bug, not a resolution bug. When you add a new subpath, add it in **both**
  `package.json#imports` and the package's vitest aliases.
- **`examples/*` do not use `customConditions`** — they resolve R-Machine *types*
  through the published `exports`, i.e. to built output. A newly added public
  export will not typecheck in an example until you run `pnpm build:packages`.
- **Barrels are dual hubs**: an `index.ts` is both the public API surface and the
  target of internal `#r-machine/*` imports. When auditing whether an export is
  used, count the `#`-prefixed imports too — a symbol can look publicly unused
  and still be load-bearing internally.

---

## Tests

`TESTING.md` is the standard. The short version of what bites most often:

- Tests mirror `src/`; type tests live beside them as `*.test-d.ts`; shared
  fixtures in `tests/_fixtures/` (leading underscore — not test files).
- A **barrel gets a single `index.test-d.ts` export-completeness test and no
  runtime test**; a runtime barrel test is tautological by construction.
- **Error assertions use `try/catch` + `expect.unreachable`**, not `.toThrow`, so
  the thrown value can be asserted richly. Helper: `captureResolveError`.
- `mockPlug` is the single mocking primitive (gears, shells, vertex, React
  consumers alike); call `resetMockPlugs()` in `afterEach`.
- Coverage is a **global 100% gate with `all: true`** — a new source file with no
  test fails CI at 0%, it does not slip through. Every `/* v8 ignore */` needs an
  inline justification.
- `makeAction`'s deep merge collapses field-equal objects to the same reference;
  drive relay re-runs with a numeric `tick` cell, not by re-setting an equal object.
- Biome can relocate a `@ts-expect-error` inside generics when it re-wraps a line;
  recheck placement after formatting.

---

## Code style

- **Biome** owns formatting and linting (2-space indent, width 120, double
  quotes, ES5 trailing commas, import organisation). Run `pnpm check` before you
  call a change done — CI runs `check:dry` and fails on drift.
- **Every new file under `packages/*/src/` carries the AGPL header** — copy the
  12-line block verbatim from a sibling file. Test files do not carry it.
- **Type-driven first.** Design the types with zero runtime, iterate until the
  surface is right, then implement. Type tests are part of the API contract, not
  an afterthought.
- **Classes only for objects with a persistent lifetime**; closure factories for
  transient, short-lived ones.
- The brand is **R-Machine**; the CLI is **`rforge`**. Never `rmachine` or `rmac`
  in code, docs or prose — those names were considered and rejected.
- `@`, `#` and `:` are **reserved** in layout names and `ResourceAtlas` keys
  (future resource-pack scoping grammar). `#` as a namespace *prefix* already
  means "internal": hidden from the consumer `Plug` surface, still visible to
  gear→gear dependencies.

---

## Changesets & release

- Any change to `packages/*` that a consumer could notice needs a changeset:
  `pnpm changeset`. The five published packages are **`linked`**, so they version
  together; `examples/*` and the benchmark are ignored.
- The repo is in changesets **pre-release mode**; `.changeset/pre.json` holds the
  current tag.
- Release is automated: pushing to `main` runs `changeset version` →
  `scripts/sync-example-deps.ts` (rewrites `examples/*` dependency ranges to the
  freshly-versioned core) → `changeset publish`. Do not hand-edit example
  dependency ranges or package versions.

---

## The Skill and the docs are product surface

`packages/rforge/skill/` (SKILL.md + `references/`) is treated with the same care
as the TypeScript: it is how green-field projects adopt R-Machine, and the model
reading it has **zero training data** about this library. So:

- Write down what cannot be guessed. Do not document what an LLM would infer.
- **Verify every claim against `examples/`** before writing it. If a pattern is
  not exercised by a real example, it is a hypothesis, not documentation.
- `docs/llms.txt` and `docs/llms-full.txt` are published for LLM consumers and
  have a hard size budget — prefer a code comment plus a changeset over adding
  prose there.
- The Skill instructs consumer projects to write their agent routing stanza into
  **`AGENTS.md`**, with `CLAUDE.md` reduced to a bare `@AGENTS.md` import. This
  repo follows the same convention.
