# @r-machine/testing

## 1.0.0-alpha.15

### Patch Changes

- 125f246: Make every `mockPlug` override a deep-partial deep-merge over the real surface, with live level-0 getters.

  **Deep-partial overrides.** A resolution override passed to `.with({ ... })` is now typed and applied as a `DeepPartial` **deep-merged** over the real surface — the same merge law as an action reducer and `ctrl.state`. Mock a single nested sub-key and its siblings are inherited from the real resource:

  ```ts
  // Override only views.intro.heading — every other key comes from the real shell.
  mockPlug(r).with({
    showcase: (locale) => ({ views: { intro: { heading: `x-${locale}` } } }),
  });
  ```

  Previously the type made nested sub-trees required in full (only level-0 keys optional) and a normal dep override replaced the whole value. This applies uniformly to deps, `$.kit` and `$.ports`.

  **Live level-0 getters.** A getter passed in an override is kept live — re-read on each access instead of snapshotted at mock time — so a mock can drive a value across a test, or verify a consumer reads a dependency fresh. An override getter is a _partial_, not a whole replacement: if a real dep getter derives `foo → { a: <state>, b: 2 }`, mocking `{ foo: { b: 100 } }` and then driving `ctrl.deps.foo.state` yields `{ a: <new state>, b: 100 }` — `a` keeps tracking, `b` stays mocked. On primitive leaves the deep-merge degrades to a plain replacement, so existing string/number mocks are unchanged.

  **Internals.** A new `mergeLiveOverride` in the testing layer handles level 0 (descriptor transplant + live re-merge) and delegates depth to `deepPartialMerge`, which is unchanged. `isPlainObject` is now exported from `r-machine/core`.

- 125f246: Add `ctrl.createRes()` for resource tests, make resource instantiation engine-internal, and give every resource family an idempotent dispose.

  **`ctrl.createRes()` + `TestSurface`.** A resource mock (`mockPlug(r)`) now exposes `createRes()` on its controller: it instantiates the mocked resource (overrides applied) and returns its **`TestSurface`** — the _same_ shape a dependency is mocked in, so both sides of a test speak one language. A **getter or cell reads as a property** (`cart.subtotal`, not `cart.subtotal()`); actions stay callable and return the resulting state; relays, `$`-members and `Symbol.dispose` are retained (a consumer's surface hides those). The method is present **only** when a `ResMatrix` is passed to `mockPlug` — a consumer is rendered, not instantiated, so its controller has no `createRes`.

  **Instantiation is engine-internal.** R-Machine resources are built by the engine on demand — never by application code. The public `r.create()` / `r.createSync()` are removed (moved behind module-private symbols); the only sanctioned direct instantiation is a test, via `ctrl.createRes()`. A new internal seam `instantiateRes` / `instantiateResSync` is exported from `r-machine/core` for the engine and the testing layer.

  **Auto-dispose.** The controller auto-disposes every instance `createRes()` created when it resets, so `using ctrl` alone tears the instance down too (a `createRes` instance is not a resolved slot, so a forgotten teardown — e.g. a `setInterval` or a relay subscription — would otherwise leak across tests).

  **Bug fix — uniform idempotent dispose.** A resource's `[Symbol.dispose]` is now idempotent across **every** family (OuterGear, Base/Inner gear, Shell), enforced at the single instantiation point. Previously only OuterGear guarded re-entry (via relay cleanup); Base/Inner/Shell returned a raw dispose. This also lets the auto-dispose compose safely with an explicit `using inst`.

  Migration (tests only): `const x = await r.create()` → `using ctrl = mockPlug(r).…; const x = await ctrl.createRes()`, and drop the `()` on getter/cell reads (`x.total()` → `x.total`). Consumer tests (rendered components) are unchanged.

- 125f246: Fix: a plain `get` accessor on a resource is now kept live on its surface instead of being snapshotted at instantiation.

  A gear member written as a bare JS accessor — `get availableDiskSpace() { return $.ports.stat() }` — was read **once** when the surface was built and frozen as a value, so a consumer reading it repeatedly always got the instantiation-time snapshot. Now `buildSurface` (and `buildTestSurface`, behind `ctrl.createRes()`) inspects the property **descriptor** and transplants a `get` accessor as a live accessor, so it is re-evaluated on every read — the fresh-on-read behaviour a plain getter is expected to have.

  Gears are not only reactive containers: a member can be a plain getter that reads a port and must return a current value each call. `_.getter`/`_.cell` remain the reactive primitives (tracked, drive re-renders); a plain `get` is now correctly live but non-reactive. Branded `_.getter`/`_.cell` members and plain data values are unaffected.

- 125f246: Add `res.perLocale` — declare a locale-keyed shell as a dependency of a locale-agnostic gear (or another shell).

  A gear has no ambient locale, so it cannot hold a shell as a plain resolved surface. `res.perLocale("shell/x")` (from the toolset) declares the shell as a dependency whose resolved value is a **loader** `(locale) => Promise<Surface>` the resource calls with a locale it receives at runtime — e.g. an `InnerGear` that renders a multilingual email in the recipient's locale. The `locale` parameter is typed to the atlas's configured locale union (an invalid locale is a compile error). It works in `withDeps` of any gear family, and inside a `Shell` (to reuse another locale's content on demand). The plain-dependency asymmetry is unchanged: a bare `shell/…` is still not a valid gear dependency — `res.perLocale` is the one sanctioned bridge, resolving to a loader rather than a surface.

  Two resolution-time batch helpers fold multiple loaders into a single call: `res.perLocale.pickAll(loader | map)` resolves every configured locale, locale-major (`Record<Locale, …>`); `res.perLocale.pick(locale, map | tuple)` resolves a batch at one locale, preserving map/tuple shape.

  `@r-machine/testing`: a `res.perLocale` dependency is mocked with a function `(locale) => partial`, deep-merged over the real localized surface (per call, per alias).

  `rforge`: the bundled Skill documents `res.perLocale` / `pickAll` / `pick`, and corrects the former "a shell can never be a dependency of a gear" guidance.

- Updated dependencies [125f246]
- Updated dependencies [125f246]
- Updated dependencies [125f246]
- Updated dependencies [125f246]
  - r-machine@1.0.0-alpha.15

## 1.0.0-alpha.14

### Patch Changes

- 7c87299: Fix `mockPlug` throwing `ERR_CIRCULAR_DEPENDENCY` when mocking a kit-resident resource (e.g. a shell registered in a machine-wide `shellKit`).

  A kit can carry deferred cycle-breaker getters for self/recursive references (`$.kit.<self>`). Those getters throw by design while their own slot is still mid-resolution — a cycle that is broken and invisible at runtime, since nothing ever reads them. But `mockPlug`'s state-binding scan walked every kit entry eagerly during the mocked plug's own resolve, tripping the getter at exactly the moment it must throw. Mocking any kit-resident shell (such as a `fmt` formatter shell) blew up even though the same resolve succeeds in production.

  The scan now tolerates a kit entry that throws on access and skips it: a still-resolving deferred entry can't be a resolved stateful surface, so it contributes nothing to bind. Ready kit entries still bind normally. Testing-layer only — no runtime/core behavior change.

- 7c87299: `verifyResourceAtlas` now accepts a `loaders` option — an array of extra loader modules (path or `URL`) to import for their registration side-effect before verification runs.

  This is needed for a split Next.js setup, where `setup.ts` imports only `pub/loader` and the server-only `inner/` loader lives in `prv/loader.ts` (imported only by `server-toolset.ts`). Without it, `inner/` keys fail with `ERR_NO_LOADER_REGISTERED`. Pass the server-only loader so its resources are checked too:

  ```ts
  const report = await verifyResourceAtlas(
    import.meta.resolve("../../src/r-machine/setup.ts"),
    { loaders: [import.meta.resolve("../../src/r-machine/prv/loader.ts")] },
  );
  ```

  Because `prv/loader.ts` starts with `import "server-only"` (which throws outside an RSC bundle), alias `server-only` to a no-op in the vitest config: `resolve.alias["server-only"] = "@r-machine/next/dev/no-op"`. A loader module that throws while importing is reported as a new `loader-module-failed` issue.

- 7c87299: Speed up `verifyResourceAtlas` by caching parsed TypeScript `SourceFile`s across calls.

  The static analysis pass created a fresh `ts.Program` per call, re-parsing and re-binding the entire type graph reachable from the setup file (`lib.d.ts` plus the whole r-machine `.d.ts` surface) every time. A process-scoped cache, installed via a custom `CompilerHost`, now reuses already-parsed `SourceFile`s across sequential programs (TS's binder skips a file whose `locals` are already set, and each program's checker keeps its own per-node links, so sharing immutable bound source files is safe). The cache is keyed by path and invalidated by mtime, so a file edited between calls is re-parsed.

  Production usage calls `verifyResourceAtlas` once per process and is unaffected; repeated callers (the test suite, or a future watch mode) get the win. In this repo the full coverage run dropped from ~28s to ~8s — the suite's single slowest file was driving the TS compiler 28 times, and under v8 coverage the compiler's execution was being instrumented on each one.

- Updated dependencies [7c87299]
  - r-machine@1.0.0-alpha.14

## 1.0.0-alpha.13

### Patch Changes

- be0872d: Rename the `mockPlug` consumer locale-override key `$.locale` → `$.ambientLocale`, and forbid it entirely on `DirectPlug`.

  The override meant three different things behind one name, which had already produced a precedence bug. The key is now named by plug kind, enforced by type:
  - **Resource plugs** (`Shell` / `shell(mono)`, `r.plug`): keep `$.locale` — it resolves the resource **at** that locale (the override wins). Unchanged.
  - **Ambient consumers** (`Plug` / `ClientPlug` / `ServerPlug`): the key is now `$.ambientLocale` — the locale the absent ambient container (React context / request header) would have supplied; a fallback that loses to an explicitly-passed locale.
  - **`DirectPlug`**: exposes **no** locale key (neither `$.locale` nor `$.ambientLocale`) — its locale is always explicit, so overriding it is a compile error; mock a dependency instead.

  Migration: in consumer-plug tests, rename `.with({ $: { locale } })` → `.with({ $: { ambientLocale } })`. Resource-plug mocks (`mockPlug(shell.plug)`) are unchanged. Internally, `PlugOverride.locale` was renamed to `ambientLocale`.

- be0872d: `verifyResourceAtlas` now accepts a `string | URL` for the setup-file path. Passing a `file:` URL (or a `URL` object) — e.g. `verifyResourceAtlas(import.meta.resolve("../../src/r-machine/setup.ts"))` — anchors the path to the test file rather than `process.cwd()`, so it reads correctly in a nested test file and is cwd-independent. Plain relative/absolute path strings still resolve against the cwd (backward compatible).
- Updated dependencies [be0872d]
- Updated dependencies [be0872d]
  - r-machine@1.0.0-alpha.13

## 1.0.0-alpha.12

### Patch Changes

- ec6c1fc: Ground-up rewrite of R-Machine on a single unified primitive.

  This release rebuilds the entire engine around one insight: i18n and dependency
  injection are the same problem — typed, context-dependent resource resolution.
  Everything resolves through one access primitive (`Plug`) over a single resource
  model, so the same machinery powers locale-aware content, shared state, and
  injected services without separate subsystems.

  Because the surface area changed comprehensively, this entry is intentionally
  high-level rather than an exhaustive per-symbol diff. The headline themes:
  - **Unified resource model.** A single entity model (logic+state, content, and
    their fusion) resolved uniformly through `Plug`, with kind-based dependency
    scoping enforced by the type system.
  - **Architectural discipline enforced by the compiler.** Wrong wiring is
    unrepresentable rather than merely flagged; dependency declarations are
    token-based for precise, readable type errors.
  - **Per-locale architecture.** Locales are first-class and fully typed
    end-to-end, delivering zero-cost i18n readiness without per-message runtime
    negotiation.
  - **Next.js App Router integration via routing strategies** (flat / path /
    origin), with proxy-driven locale routing and a request-scoped server model
    that yields SSR's process/request two-tier caching for free.
  - **React adapter** with a per-consumer wire model, state that survives HMR, and
    opt-in React Compiler interop.
  - **`@r-machine/testing`** built on a single uniform test primitive (`mockPlug`)
    that works identically across every entity kind and on React consumers.
  - **`rforge` CLI + LLM Skill** for scaffolding and agent-assisted development,
    treating the Skill as product surface on par with the code.

  Migrating from a previous alpha: treat this as a new baseline. The public API,
  generic signatures, and configuration entry points changed throughout; follow
  the current docs and the `rforge` scaffolds rather than porting old call sites
  mechanically.

- Updated dependencies [ec6c1fc]
  - r-machine@1.0.0-alpha.12
