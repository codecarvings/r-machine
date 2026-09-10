# @r-machine/react

## 1.0.0-beta.0

### Patch Changes

- a1bc217: Loosen the inter-package peer ranges, declare a supported Node range, and stop shipping coverage artifacts.

  **Peer ranges.** The R-Machine packages declared each other with `workspace:*`, which pnpm rewrites to an **exact** version at publish time — `@r-machine/react@1.0.0-alpha.15` required literally `r-machine@1.0.0-alpha.15`. Any drift between two installed R-Machine packages was therefore an `ERESOLVE` failure rather than a warning. They now use `workspace:^`, published as `^1.0.0-<version>`, which accepts later releases of the same line and the eventual stable `1.0.0`. The packages still version and publish in lockstep, so a matched set remains the expected install.

  **`engines`.** All five packages now declare `"node": ">=20.9.0"`. This is the floor the codebase already assumed rather than a new restriction: `Symbol.dispose` (the resource-teardown convention) needs Node 20.4+, and `@r-machine/next` targets a Next.js version that itself requires 20.9+. Node 18 is end-of-life.

  **Packaging.** The `files` globs (`**/*.js`, `**/*.d.ts`, …) matched anything anywhere in the package directory, so a local coverage run leaked `coverage/*.js` into the tarball. `files` now excludes `**/coverage/**`.

- a1bc217: Fix a component rendering the previous test's state, and ignoring a new `mockPlug` controller, when one test file renders the same component more than once.

  ### Fixed
  - **`@r-machine/react` — a wire resolved before `disposeResources()` is no longer reused.** A consumer plug caches its wires outside React, for as long as the plug itself lives. `disposeResources()` — which `mockPlug`'s reset runs when a test's `using ctrl` scope closes — tears down the slots those wires resolved against and drops their subscriptions without notifying them, so a cached wire was never marked stale and the next mount of the same component, i.e. the next test in the file, got its dead plugin back. On screen: the previous test's final state. Through the new controller: nothing — the mock's transform never ran, so `ctrl.deps[i].state = …` was silently ignored and reading `ctrl.deps[i].state` threw `ERR_STATE_NOT_RESOLVED`. A test rendering the component with no mock at all, after a mocked one, was hit the same way. Every test still passed on its own, because Vitest gives each test file a fresh module registry — so the only workaround was folding all the checks into a single test. Cache entries now record the machine's resource generation and are rebuilt once a dispose has advanced it. Next.js client components share this toolset and get the same fix.

  ### Added
  - **`PlugMachine.getResourceGeneration()`** (`r-machine/core`) — a counter that every `disposeResources()` advances and nothing else does. Since a dispose notifies no subscriber, it is the only trace of one visible outside the machine; the React adapter keys its wire cache on it. `PlugMachine` is the bridge the adapters and `@r-machine/testing` reach through `PLUG_MACHINE_ACCESSOR`; application code does not implement it.

- a1bc217: Relicense every R-Machine package from AGPL-3.0-only to Apache-2.0.

  R-Machine was published under the GNU Affero General Public License with a commercial exception: open source projects could use it freely, anything proprietary required a separate arrangement. That trade-off is now gone. All five packages — `r-machine`, `@r-machine/react`, `@r-machine/next`, `@r-machine/testing` and `rforge` — are licensed under the **Apache License, Version 2.0**, which permits use, modification and redistribution in any project, proprietary software included, and carries an express patent grant.

  Nothing is asked in return beyond what Apache-2.0 states: keep the copyright and licence notices, and note any significant changes you make to the files you redistribute.

  This is a one-way loosening — no permission previously granted is withdrawn. Versions published before this release remain available under the terms they shipped with; from this release forward the licence is Apache-2.0. The per-file notice is now a short SPDX header, and the commercial-licensing contact is retired.

- a1bc217: Retire the `experimental.outerGear` flag — `OuterGear` and `VertexFrame` are now unconditional.

  `OuterGear` (and, on the React/Next side, `VertexFrame`) were withheld from the toolsets until `experimental: { outerGear: "on" }` was passed to `RMachine.create(...)`. The feature has stabilized, so the flag is gone and both are always part of the surface. The `experimental` option itself stays — it is the reserved namespace for the next opt-in feature — but no flag is defined right now.

  ### Changed
  - `OuterGear` is always present on `rMachine.createToolset()`, and `VertexFrame` on the React bare/standard toolsets and the Next client toolset. Remove `experimental: { outerGear: "on" }` from your `RMachine.create(...)` call — with no flag declared, `ExperimentalFlags` rejects every key, so leaving it in place is now a type error rather than a silently ignored option.
  - A layout with `gear:outer` entries no longer needs an opt-in, so `validateRMachineConfig` no longer rejects one.

  ### Removed
  - `ERR_EXPERIMENTAL_OUTER_GEAR_REQUIRED` — the error it reported can no longer occur.

  ### Added
  - `ExperimentalTools<EF>` (exported from `r-machine/core`) — the type-level seam each toolset intersects with, so that a future flag contributes its tools to the surface it belongs to. With no flag declared it resolves to `{}` and toolset shapes are unchanged.

- Updated dependencies [a1bc217]
- Updated dependencies [a1bc217]
- Updated dependencies [a1bc217]
- Updated dependencies [a1bc217]
  - r-machine@1.0.0-beta.0

## 1.0.0-alpha.15

### Patch Changes

- Updated dependencies [125f246]
- Updated dependencies [125f246]
- Updated dependencies [125f246]
- Updated dependencies [125f246]
  - r-machine@1.0.0-alpha.15

## 1.0.0-alpha.14

### Patch Changes

- Updated dependencies [7c87299]
  - r-machine@1.0.0-alpha.14

## 1.0.0-alpha.13

### Patch Changes

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

## 1.0.0-alpha.11

### Patch Changes

- f7656f0: All r-machine library packages are now licensed under AGPL-3.0-only. For proprietary licensing inquiries, contact: licensing@codecarvings.com.

  ### Breaking Changes
  - **LICENSE CHANGE** `r-machine`: Package license changed from MIT to AGPL-3.0-only.
  - **LICENSE CHANGE** `@r-machine/react`: Package license changed from MIT to AGPL-3.0-only.

- Updated dependencies [f7656f0]
  - r-machine@1.0.0-alpha.11

## 1.0.0-alpha.10

### Patch Changes

- e892af5: Add formatters support, locale type safety, and builder API across all packages.

  ### Breaking Changes
  - **Change** `RMachine` constructor to require `(config, extensions)` parameters; use `RMachine.builder(config).create()` or `RMachine.builder(config).with(extensions).create()` instead.
  - **Change** `RMachine` generic parameters from `RMachine<RA>` to `RMachine<RA, L, FP>` to include Locale and Formatter Provider types.
  - **Remove** `config` property from `RMachine`; use `rMachine.locales` and `rMachine.defaultLocale` instead.
  - **Rename** `R$` to `RCtx`; the context object now includes `fmt` property and typed `locale`.
  - **Change** `RMachine.locales` to return a frozen `LocaleList<L>` instead of a mutable array.
  - **Rename** `formatters` property of `RMachineExtensions` to `Formatters`.
  - **Replace** `createPathAtlasDecl` with `PathAtlasSeed.create` in `@r-machine/next`.
  - **Replace** `createFormatters` with `FormattersSeed.create` in `r-machine`.
  - **Change** `ReactBareToolset` generic parameters from `<RA>` to `<RA, L, FP>` in `@r-machine/react`.
  - **Change** `NextAppServerToolset` generic parameters from `<RA, PA, LK>` to `<RA, L, FP, PAP, LK>` in `@r-machine/next`.
  - **Change** `NextAppClientToolset` generic parameters from `<RA, PA>` to `<RA, L, FP, PAP>` in `@r-machine/next`.
  - **Change** all locale parameters from `string` to generic `L extends AnyLocale` across all packages.

  ### Added
  - Add `RMachine.builder(config)` static method with fluent `.with(extensions).create()` pattern.
  - Add `FormattersSeed.create(factory)` for creating formatter providers with caching.
  - Add `PathAtlasSeed.create(decl)` and `PathAtlasSeed.for<L>().create(decl)` for path atlas configuration.
  - Add `fmt` method to `RMachine` for locale-specific formatter access.
  - Add `useFmt` hook to `@r-machine/react` for accessing formatters in components.
  - Add `getFmt` method to `NextAppServerToolset` in `@r-machine/next` for server-side formatter access.
  - Add `readonly defaultLocale` and `readonly locales` properties to `RMachine`.
  - Add `RMachineLocale<T>` and `RMachineRCtx<T>` type exports for type inference from builder.
  - Add locale type support to `@r-machine/react` hooks (`useLocale`, `useSetLocale`).
  - Add locale type support to `@r-machine/next` strategies and toolsets.
  - Add default empty formatters when no formatters are configured.

  ### Fixed
  - **Fix** `.d.cts`/`.d.ts` dual-identity issue by adding `types` condition to package imports maps.
  - **Fix** promise handling in `resolveRFromModule` and `resolveR` for better error handling.

- Updated dependencies [e892af5]
  - r-machine@1.0.0-alpha.10

## 1.0.0-alpha.9

### Patch Changes

- 8992765: Add structured error handling with typed errors and error codes.

  ### Breaking Changes
  - **Change** `ReactBareToolset` and `ReactToolset` to throw `RMachineUsageError` with `ERR_CONTEXT_NOT_FOUND` when context is missing.
  - **Change** `ReactBareToolset` to throw `RMachineUsageError` with `ERR_MISSING_WRITE_LOCALE` when no `writeLocale` function is provided.
  - **Change** locale validation errors in `ReactBareToolset`, `ReactToolset` and `ReactStandardImpl` to throw `RMachineUsageError` with `ERR_UNKNOWN_LOCALE` instead of generic `RMachineError`.

  ### Added
  - Add `@r-machine/react/errors` export path with `ERR_CONTEXT_NOT_FOUND` and `ERR_MISSING_WRITE_LOCALE` error codes.

- Updated dependencies [8992765]
  - r-machine@1.0.0-alpha.9

## 1.0.0-alpha.8

### Patch Changes

- 2b714c4: Complete refactoring of types, functions and classes to support the new "PathAtlas" feature.

  ### Breaking Changes
  - **Change** constructor of `ReactStandardStrategy` class to accept an `rMachine` instance as first parameter; config is now the second parameter.
  - **Change** `ReactStandardStrategy` class to accept a new `RA` (ResourceAtlas) generic parameter.
  - **Change** `createReactToolset` function signature to require a second `ReactImpl` parameter (with `readLocale` and `writeLocale`).
  - **Change** `ReactToolset` type: `ReactRMachine` component no longer accepts `locale` and `writeLocale` props directly; it now accepts `fallback` and `Suspense` props instead (locale is read internally via `ReactImpl`).
  - **Change** `ReactRMachine` from an interface with a `probe` static method to a plain function component type.
  - **Remove** `ReactStandardImplProvider` class.
  - **Remove** `ReactStrategy` class (replaced by `ReactStrategyCore` and `ReactBareStrategy`).
  - **Remove** `createReactStandardToolset` function, `ReactStandardImpl` type, `ReactStandardToolset` type and `ReactStandardRMachine` type (their functionality is now merged into `createReactToolset`, `ReactImpl`, `ReactToolset` and `ReactRMachine`).
  - **Remove** `ReactToolset` builder helper (the object with a `create` method).
  - **Remove** `ReactRMachine` type from the core exports (replaced by the new `ReactRMachine` function type).
  - **Move** `PartialReactStandardStrategyConfig` and `ReactStandardStrategyConfig` types from `@r-machine/react` to `@r-machine/react/core`.

  ### Added
  - Add `ReactBareStrategy` class and `createReactBareToolset` function with `ReactBareRMachine` type and `ReactBareToolset` type — a lightweight toolset that accepts `locale` and `writeLocale` props directly (equivalent to the previous `ReactToolset`).
  - Add `ReactStrategyCore` and `ReactStandardStrategyCore` abstract classes for building custom strategies.
  - Add `ReactImpl` type (with `readLocale` and `writeLocale`) as the standard implementation interface for `createReactToolset`.

- Updated dependencies [2b714c4]
  - r-machine@1.0.0-alpha.8

## 1.0.0-alpha.6

### Patch Changes

- 5288e2c: Change createReactStandardToolset function to return a promise;
  Remove exportation of type ReactStandardRMachine;
  Remove validation of suspense prop provided to the ReactRMachine component created by createReactStandardToolset;
  Remove fallback and Suspense props from the ReactRMachine type returned by createReactToolset.
- Updated dependencies [5288e2c]
  - r-machine@1.0.0-alpha.6

## 1.0.0-alpha.5

### Patch Changes

- 99e56a5: Add ReactStandardImpl;
  Add fallback and Suspense props to ReactStandardRMachine;
  Add DelayedSuspense.create method;
  Change ReactStandardImplProvider to accept an implFactory instead of an Impl object;
  Change ReactStandardImpl to use the new impl factory logic without bins;
  Change ReactStrategy.createToolset return type (Promise<>).
- Updated dependencies [99e56a5]
  - r-machine@1.0.0-alpha.5

## 1.0.0-alpha.4

### Patch Changes

- 315569e: Added @r-machine/react/utils export path.
  Added DelayedSuspense component.
  Added localeDetector and localeStore to ReactStandardStrategyConfig.
  Added ReactStandardImplProvider class.
  Removed "impl" from ReactStandardStrategyConfig.
- Updated dependencies [315569e]
- Updated dependencies [315569e]
  - r-machine@1.0.0-alpha.4

## 1.0.0-alpha.3

### Patch Changes

- 67952cd: Remove currentLocale from information provided by $ argument in ReactStrategyImpl.writeLocale function
- Updated dependencies [67952cd]
  - r-machine@1.0.0-alpha.3

## 1.0.0-alpha.2

### Patch Changes

- 7ffa541: Add changeset
- Updated dependencies [7ffa541]
  - r-machine@1.0.0-alpha.2

## 1.0.0-alpha.1

### Patch Changes

- b57d000: Initial release
