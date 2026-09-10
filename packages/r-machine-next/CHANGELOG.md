# @r-machine/next

## 1.0.0-beta.0

### Patch Changes

- a1bc217: Loosen the inter-package peer ranges, declare a supported Node range, and stop shipping coverage artifacts.

  **Peer ranges.** The R-Machine packages declared each other with `workspace:*`, which pnpm rewrites to an **exact** version at publish time — `@r-machine/react@1.0.0-alpha.15` required literally `r-machine@1.0.0-alpha.15`. Any drift between two installed R-Machine packages was therefore an `ERESOLVE` failure rather than a warning. They now use `workspace:^`, published as `^1.0.0-<version>`, which accepts later releases of the same line and the eventual stable `1.0.0`. The packages still version and publish in lockstep, so a matched set remains the expected install.

  **`engines`.** All five packages now declare `"node": ">=20.9.0"`. This is the floor the codebase already assumed rather than a new restriction: `Symbol.dispose` (the resource-teardown convention) needs Node 20.4+, and `@r-machine/next` targets a Next.js version that itself requires 20.9+. Node 18 is end-of-life.

  **Packaging.** The `files` globs (`**/*.js`, `**/*.d.ts`, …) matched anything anywhere in the package directory, so a local coverage run leaked `coverage/*.js` into the tarball. `files` now excludes `**/coverage/**`.

- a1bc217: Export `localeHeaderName` from `@r-machine/next/core`.

  ### Added
  - **`localeHeaderName`** — the request header the proxy writes the resolved locale into, and the server toolset reads back, when `autoLocaleBinding` is on. It was already the contract between those two halves but had no public name, so app code holding the request headers — a route handler, an instrumentation hook, anything outside a plug — had to hardcode the string. The constant moved from the app strategy core up to `core/proxy.ts`, next to `RMachineProxy`: it is part of the proxy's contract, and that barrel is the published one. Its type is the literal `"x-rm-locale"`, not `string`.

- a1bc217: Fix the Next App Router path strategy poisoning the client router's prefetch cache with a cookie-dependent redirect, and declare the auto-detect header dependency on the responses that can carry it.

  ### Fixed
  - **Path strategy — auto-detect no longer applies to RSC requests.** With `implicitDefaultLocale` on, an auto-detect URL answered a request from the locale cookie: a `<Link href="/">` — the crawlable href a locale switcher renders for the default locale — made the router prefetch `/` while the cookie still held the previous locale, and the resulting `307 → /it` was cached by the client router under the key `/`. `router.push("/")` after a switch reads that cache entry instead of re-requesting, so switching _to_ the default locale landed back on the previous one, with the cookie already updated. Auto-detect is an entrance concern, so it now runs on document requests only; an RSC request (navigation or prefetch) always gets the canonical content of the URL it asked for, which for an implicit URL is the default locale. The non-implicit branch is unchanged: without implicit URLs an unprefixed path has no canonical content of its own, so the redirect is its only possible outcome.

    The exposure is as wide as `autoDetectLocale.pathMatcher`: the root-only matcher is just the default for `implicitDefaultLocale` on, any path the matcher covers produced the same cookie-dependent response, and with `implicitDefaultLocale` off the default matcher is already every standard path. The fix sits in the auto-detect branch, so it covers the whole matched set.

    Next strips its own `rsc` and `next-router-prefetch` headers before the proxy runs (measured on Next 16.3), so the request kind is read from `next-url` — sent by the client router on every RSC request — with `sec-fetch-dest` as the second marker. A request carrying neither (curl, older bots) is treated as a document request, preserving the previous behaviour.

  - **`vary` on the auto-detect responses.** The auto-detect branch picks the locale from `Cookie` and `Accept-Language`, and nothing declared that dependency to shared caches. Both the path strategy's auto-detect branches and the flat strategy's rewrite (whose every handled path is chosen from those headers) now append `Accept-Language, Cookie` — `Accept-Language` alone when the cookie is off. `redirectToCanonicalLocalePath` is deliberately left alone: the `/en/about → /about` canonicalization depends on the URL only, and a `vary` there would be spurious.

    Measured limit: `vary` survives on a redirect but **not** on a rewrite, where Next owns it and overwrites whatever the proxy (or `next.config` `headers()`) sets. It is declared on both outcomes anyway — it is correct where the response is produced — but it cannot be relied on for the outcome that matters most, the cacheable 200.

  - **Locale-dependent responses are kept out of a URL-keyed shared cache.** A rewrite inherits the `cache-control` of the page it rewrites to: for a prerendered target that is `s-maxage` measured in months, correct for the canonical locale-prefixed URL and wrong at the requested one, where the response was chosen from a cookie. A shared cache keying on the request URL would store it and serve it to everyone, silently disabling auto-detect for whoever did not warm it — across every path the auto-detect matcher covers in the path strategy, which the consumer can widen to the whole site, and across every handled path in the flat strategy, where the locale is never in the URL. Since `vary` cannot express this and `cache-control` survives the rewrite, those responses now carry `private, no-cache`: a private cache may still keep them, it just has to revalidate — which it has to anyway once the locale cookie changes.

    Scoped to exactly the header-dependent responses: in the path strategy, paths outside the auto-detect matcher are untouched, and so is the RSC rewrite, whose outcome no longer depends on the cookie after the fix above — so client-router traffic, most of the navigation on a live site, stays fully shared-cacheable.

  ### Added
  - **`localeCacheControl` on the path and flat strategy configs** — `"private" | "inherit"`, default `"private"`. It names what the proxy writes on the locale-dependent responses, not what sits in front of the app: `"private"` marks them `private, no-cache`, `"inherit"` leaves the `cache-control` Next would assign. Whether the second is safe depends on the cache in front resolving the locale itself — by running the proxy ahead of its own lookup, or by keying on the cookie — which is a property of the deployment that this library cannot observe or test, hence an explicit opt-in rather than a guess. Same key, same default and same meaning on both strategies; it just covers a different set of responses on each. The origin strategy does not take it: there the locale comes from the host, which is already part of any cache key.

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
  - @r-machine/react@1.0.0-beta.0

## 1.0.0-alpha.15

### Patch Changes

- Updated dependencies [125f246]
- Updated dependencies [125f246]
- Updated dependencies [125f246]
- Updated dependencies [125f246]
  - r-machine@1.0.0-alpha.15
  - @r-machine/react@1.0.0-alpha.15

## 1.0.0-alpha.14

### Patch Changes

- 7c87299: Move module loading off `RMachine.create({ load })` onto `ResourceAtlas.loader`, and split resources into `pub/` (client-safe) and `prv/` (server-only) folders — fixing a security bug where server-only `inner/` gears could leak into the Next.js client bundle.

  - **New loader API.** `ResourceAtlas.loader.register(prefixes, fn)` registers a `(path, options) => Promise<module>` loader for one or more layout prefixes, or `["*"]` as a catch-all (a prefix-specific loader wins over `"*"`). Multiple `register` calls accumulate. The `load` option on `RMachine.create(...)` is **removed**; the config now carries the loader. New error `ERR_NO_LOADER_REGISTERED` when a layout prefix has no matching loader.
  - **`pub/` + `prv/` folders.** Resources live under `pub/` (`base`/`outer`/`vertex`/`shell`) or `prv/` (`inner`), each owning a `loader.ts` whose dynamic-import glob is rooted there. `pub/loader.ts` is imported from `setup.ts`; `prv/loader.ts` is fenced with `import "server-only"` and imported only from `server-toolset.ts`, so the server-only glob never reaches the client bundle. The `pub`/`prv` segment is filesystem-only — atlas namespaces are unchanged (`base/config`, `inner/catalog`). Projects with no server-only resources use `pub/` only and register `["*"]`. `server-setup.ts` is removed.
  - **Build-safe green-field.** Because each glob is rooted at a folder that always contains its `loader.ts`, the bundler context is never empty — scaffolding the folders before adding any resource no longer breaks the first build.

- 7c87299: Fix a dev-only `ERR_MODULE_NOT_FOUND` on `next/navigation` when the jiti dev loader walks a resource graph that reaches the server toolset — e.g. an OuterGear importing a `"use server"` action that uses `ServerPlug`, both during dev HMR and under `verifyResourceAtlas`.

  The dev importer follows static imports across boundaries that Next's bundler would otherwise split, ending up in `next/*` subpaths that pure-ESM resolution can't resolve (`next` ships no `exports` map, so its entrypoints are extensionless files the bundler — but not Node ESM — extends to `.js`). Two boundaries are now handled:

  - **`"use client"` boundary.** Under jiti, any module carrying a leading `"use client"` directive is replaced with a client-reference stub (mirroring what Next does in a build), so `client-toolset` and its `next/navigation` import are never executed server-side.
  - **Server toolset construction.** `createClientToolset`/`createServerToolset` now memoize their result on the `rMachine`. Under dev HMR the jiti-loaded copy reuses the real toolset Next already built — so server actions invoked from an OuterGear factory keep working. Under `verifyResourceAtlas` (no Next runtime to build it), `createServerToolset` returns an inert toolset instead of constructing, which would otherwise import the strategy server-impl and crash on `next/navigation`. This is safe because the verifier only loads modules and checks their shape; it never runs factories.

  No API changes; production builds are unaffected.

- Updated dependencies [7c87299]
  - r-machine@1.0.0-alpha.14
  - @r-machine/react@1.0.0-alpha.14

## 1.0.0-alpha.13

### Patch Changes

- be0872d: Fix `ServerPlug` locale precedence under `mockPlug`: an explicitly-passed locale now wins over a `mockPlug` ambient-locale override.

  Previously a `mockPlug` locale override always won, even when the consumer passed an explicit locale via `useR(params)` / `useR(locale)` / `useUnboundR` — contradicting the documented behavior. Now the consumer override key is `$.ambientLocale` (see the `@r-machine/testing` changeset), a **fallback**: it fills the locale only for the ambient, zero-arg `ServerPlug.useR()` (request-header-derived). When the caller passes an explicit locale, that wins and `$.ambientLocale` is a no-op — mock a dependency instead.

- Updated dependencies [be0872d]
- Updated dependencies [be0872d]
  - r-machine@1.0.0-alpha.13
  - @r-machine/react@1.0.0-alpha.13

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
  - @r-machine/react@1.0.0-alpha.12

## 1.0.0-alpha.11

### Patch Changes

- f7656f0: All r-machine library packages are now licensed under AGPL-3.0-only. For proprietary licensing inquiries, contact: licensing@codecarvings.com.

  ### Breaking Changes
  - **LICENSE CHANGE** `r-machine`: Package license changed from MIT to AGPL-3.0-only.
  - **LICENSE CHANGE** `@r-machine/react`: Package license changed from MIT to AGPL-3.0-only.

- Updated dependencies [f7656f0]
  - r-machine@1.0.0-alpha.11
  - @r-machine/react@1.0.0-alpha.11

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
  - @r-machine/react@1.0.0-alpha.10

## 1.0.0-alpha.9

### Patch Changes

- 8992765: **LICENSE CHANGE**: Package license changed from MIT to AGPL-3.0-only. Add structured error handling with typed errors and error codes.

  ### Breaking Changes
  - **LICENSE CHANGE**: Package license changed from MIT to AGPL-3.0-only.
  - **Change** `NextAppPathStrategyCore` and `NextAppOriginStrategyCore` to throw `RMachineConfigError` with `ERR_INVALID_STRATEGY_CONFIG` on invalid configuration.
  - **Change** `PathAtlas` (`buildPathAtlas`) to throw `RMachineConfigError` with `ERR_PATH_ATLAS_MALFORMED` on malformed path declarations.
  - **Change** `HrefCanonicalizer` and `HrefTranslator` to throw `RMachineUsageError` with `ERR_INVALID_PATH` on invalid paths and `ERR_PATH_TRANSLATION_FAILED` on translation failures.
  - **Change** `validateServerOnlyUsage` to throw `RMachineUsageError` with `ERR_SERVER_ONLY`.
  - **Change** `NextAppServerToolset` to throw `RMachineUsageError` with `ERR_UNKNOWN_LOCALE` on invalid locale.

  ### Added
  - Add `@r-machine/next/errors` export path with error codes: `ERR_INVALID_STRATEGY_CONFIG`, `ERR_PATH_ATLAS_MALFORMED`, `ERR_SERVER_ONLY`, `ERR_INVALID_PATH`, `ERR_FEATURE_REQUIRES_PROXY`, `ERR_LOCALE_BIND_CONFLICT`, `ERR_LOCALE_UNDETERMINED`, `ERR_PATH_TRANSLATION_FAILED`.
  - Export `NextAppOriginStrategyUrlTranslator`, `NextAppPathStrategyPathCanonicalizer` and `NextAppPathStrategyPathTranslator` from `@r-machine/next/core`.

- Updated dependencies [8992765]
- Updated dependencies [8992765]
  - r-machine@1.0.0-alpha.9
  - @r-machine/react@1.0.0-alpha.9

## 1.0.0-alpha.8

### Patch Changes

- 2b714c4: Complete refactoring of types, functions and classes to support the new "PathAtlas" feature.

  ### Breaking Changes
  - **Change** constructor of NextAppFlatStrategy, NextAppOriginStrategy and NextAppPathStrategy classes to accept an rMachine instance as first parameter.
  - **Change** strategy classes to accept a new PA (PathAtlas) generic parameter.
  - **Remove** NextAppImplProvider class.
  - **Remove** NextAppStrategy class.
  - **Remove** NextClientImplProvider class and NextStrategy class.
  - **Remove** createNextClientToolset function, NextClientImpl type, NextClientPathToolset type, NextClientPlainToolset type, NextClientRMachine type, NextClientToolset type and NextStrategyKind type.
  - **Remove** NextAppServerImplComplement type, NextAppServerPathRMachine type, NextAppServerPathToolset type, NextAppServerPlainRMachine type, NextAppServerPlainToolset type and DefaultLocaleKey type.
  - **Remove** NextToolset builder helper.
  - **Move** PartialNextAppFlatStrategyConfig, PartialNextAppOriginStrategyConfig and PartialNextAppPathStrategyConfig from @r-machine/next to @r-machine/next/core.

  ### Added
  - Add HrefCanonicalizer, HrefMapper and HrefTranslator classes.
  - Add buildPathAtlas function and path-related types: AnyPathAtlas, ExtendedPathAtlas, PathAtlasCtor, BoundPathComposer, PathParamMap, PathParams, PathSelector, NonTranslatableSegmentDecl and TranslatableSegmentDecl.
  - Add createPathAtlasDecl function.
  - Add NextAppFlatStrategyCore, NextAppOriginStrategyCore, NextAppPathStrategyCore and NextAppStrategyCore classes.
  - Add createNextAppClientToolset function, NextAppClientImpl type, NextAppClientRMachine type and NextAppClientToolset type.
  - Add createNextAppNoProxyServerToolset function, NextAppNoProxyServerImpl type and NextAppNoProxyServerToolset type.
  - Add NextAppServerRMachine type.
  - Add strategy config types: NextAppFlatStrategyConfig, PartialNextAppFlatStrategyConfig, AnyNextAppFlatStrategyConfig, NextAppOriginStrategyConfig, PartialNextAppOriginStrategyConfig, AnyNextAppOriginStrategyConfig, LocaleOriginMap, NextAppPathStrategyConfig, PartialNextAppPathStrategyConfig, AnyNextAppPathStrategyConfig, NextAppStrategyConfig, PartialNextAppStrategyConfig and AnyNextAppStrategyConfig.

- Updated dependencies [2b714c4]
- Updated dependencies [2b714c4]
  - @r-machine/react@1.0.0-alpha.8
  - r-machine@1.0.0-alpha.8

## 1.0.0-alpha.7

### Patch Changes

- fb3657f: - Added checks to ensure that server elements (NextServerRMachine, bindLocale, getLocale, etc..) are not used in client components.
  - Fixed NextToolsetBuilder return type.
  - Fixed pathBuilder return value for implicitDefaultLocale.
  - Removed AnyNextPlainStrategy and AnyNextPathStrategy types.

## 1.0.0-alpha.6

### Patch Changes

- 5288e2c: Add NextAppFlatStrategy implementation;
  Add NextAppOriginStrategy implementation;
  Add NextClientPlainToolset;
  Add NextClientPathToolset with usePathBuilder;
  Add NextAppServerPlainRMachine, NextAppServerPlainToolset;
  Add NextAppServerPathRMachine, NextAppServerPathToolset with getPathBuilder and EntrancePage;
  Change properties name pathMatcherRegExp to pathMatcher in CustomImplicitDefaultLocale and CustomAutoDetectLocale interfaces used by NextAppPathStrategyConfig.
- Updated dependencies [5288e2c]
- Updated dependencies [5288e2c]
  - r-machine@1.0.0-alpha.6
  - @r-machine/react@1.0.0-alpha.6

## 1.0.0-alpha.5

### Patch Changes

- 99e56a5: Add full implementation of NextAppPath strategy;
  Add NextAppImplProvider, NextAppServerToolset, NextAppStrategy, createNextAppServerImpl;
  Change NextToolset.createForClient and createForServer methods to return Promises;
  Remove NextAppRouterEntrancePage, NextAppRouterImplProvider, NextAppRouterServerImpl, NextAppRouterStandardStrategy, NextAppRouterServerToolset.
- Updated dependencies [99e56a5]
  - r-machine@1.0.0-alpha.5

## 1.0.0-alpha.4

### Patch Changes

- 315569e: Added initial implementation of NextAppRouter standard strategy.
- Updated dependencies [315569e]
- Updated dependencies [315569e]
  - r-machine@1.0.0-alpha.4

## 1.0.0-alpha.3

### Patch Changes

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
