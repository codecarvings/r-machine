# Testing guide

Internal engineering standard for the R-Machine test suites (runtime **and**
type tests). The goal is a senior-level suite: zero tautological tests, 100%
coverage locked by a ratchet, and one obvious way to write each kind of test.

## Layout & tooling

- Tests live in `packages/<pkg>/tests/`, mirroring `src/` (`tests/core/res.test.ts`
  ↔ `src/core/res.ts`). Type tests sit beside them as `*.test-d.ts`.
- Shared fixtures live in `tests/_fixtures/` (note the leading underscore; they
  are not test files). Reuse them — do not re-implement env wiring per file.
- `pnpm test` runs runtime + type tests for every package. **Always validate
  with the full `pnpm test`** — scoped `vitest --typecheck` is unreliable.
- The `#r-machine/*` aliases must resolve to `src` in vitest. Without them a
  second `plug.ts` instance loads and `getPlugResolve` returns `undefined`.

### Barrels (`index.ts`)

A barrel only re-exports, so it gets **a single type test and no runtime test** —
`index.test-d.ts` with one `it()` that verifies *export completeness* (every
expected symbol is exported, with its broad shape). A runtime `index.test.ts`
would be tautological. Type-shape details belong in the per-symbol `*.test-d.ts`.
See `packages/r-machine/tests/locale/index.test-d.ts` for the canonical form.

## Definition of done (per namespace task)

1. Read the source. **Do not assume it is correct** — a missing test often hides
   a real bug. Surface bugs found this way in a *separate* commit from the tests.
2. Inventory existing tests; delete or rewrite tautological ones (see below).
3. Runtime tests: behaviour, edge cases, error paths, invariants.
4. Type tests (`*.test-d.ts`): the type contract — especially for gear/plug/
   composer surfaces. This project is type-driven; types are part of the API.
5. Drive the namespace to 100% on all four metrics, then lock it in the ratchet.
6. `pnpm test` green (typecheck included) before moving on.

## What counts as tautological (delete these)

- Asserting a mock returns what it was just told to return.
- `expect(x).toBeDefined()` as the only assertion on a real value.
- Re-testing the framework / language (class `instanceof` chains, that a getter
  returns the field it wraps) with no domain logic in between.
- A test whose assertions restate the type rather than exercise behaviour — move
  that intent into a `*.test-d.ts` instead.

A test earns its place by failing when a *plausible* bug is introduced. If you
can't name the bug it catches, it's probably tautological.

## Preferred patterns

- **Error assertions** — `try/catch` + `expect.unreachable`, not `.toThrow`, so
  you can assert richly on the thrown value while still failing if nothing is
  thrown. Use the shared helper:
  `tests/_fixtures/capture-resolve-error.ts` → `captureResolveError(fn)`.
- **Resolving real resources** — use `buildResolveEnv(layout, modules, opts?)`
  from `tests/_fixtures/build-resolve-env.ts`. It wires BlueprintManager +
  ResManager + WireManager exactly like RMachine, with one shared
  CassetteRecorder, and returns `{ rm, wm, recorder, resolve }`.
- **Mocking dependencies** — `mockPlug` is the single primitive; it works
  uniformly on gears, shells, vertex and React consumers. Call `resetMockPlugs()`
  in `afterEach` (examples/React/Next setups already do).
- **Type tests** — `expectTypeOf` for shape, `@ts-expect-error` for rejections.
  Keep one assertion per behaviour and comment *why* a rejection is expected.

### Gotchas

- `makeAction`'s `deepPartialMerge` collapses field-equal objects to the same
  ref; drive relay re-runs with a numeric `tick` cell, not a re-set equal object.
- Biome can relocate `@ts-expect-error` inside generics on re-wrap — recheck
  placement after formatting.
- `examples/*` resolve r-machine **types** to the built `dist`; run `pnpm build`
  before expecting new public exports to typecheck there.

## Coverage ratchet

The global gate is off during the overhaul so unfinished namespaces don't red
CI. Coverage lives in `vitest.config.ts` under `coverage.thresholds` as per-glob
entries. When a namespace hits 100% on every metric, lock it:

```ts
// vitest.config.ts
"r-machine/src/<namespace>/**": FULL,
```

The text reporter **hides files that are 100% on all four metrics**, so a
namespace vanishing from the report means it's complete. To read true numbers:

```sh
pnpm vitest run --coverage --coverage.reporter=json-summary \
  --coverage.reportsDirectory=/tmp/rm-cov
```

Every `/* v8 ignore */` must carry an inline justification and be defensible in
review — it is the only sanctioned way to leave a line uncovered at 100%.

When all namespaces are locked, restore a global `100` backstop in `thresholds`.
