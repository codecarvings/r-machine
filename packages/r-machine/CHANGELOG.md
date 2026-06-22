# r-machine

## 1.0.0-alpha.13

### Patch Changes

- be0872d: Add `DirectPlug` — a container-free, framework-neutral consumer plug on the core toolset.

  `DirectPlug` connects directly to R-Machine without a strategy (React/Next) in between: the locale is passed explicitly to `useR(locale)`, resolution is async, and it carries no locale container. It can be used anywhere — server components, client handlers, queue workers, cron jobs — which makes the `r-machine` core usable standalone (without `@r-machine/react` or `@r-machine/next`) for the stateless subset of resources.

  ### Added
  - Add `DirectPlug` to the toolset returned by `rMachine.createToolset()`. Its dependency scope is `valid@direct` (shells + base gears only) — exactly the resources whose resolution is a pure function of locale. The `$` context exposes `{ locale, kit }` (a read-only echo of the passed locale; no `setLocale`/`getPath`/`params`). Single-resource, list, and map call forms are supported; resolution goes through the single-shot `getGatePlugin` path (no persistent wire). `mockPlug` works on it uniformly — note that since a direct plug's locale is always explicit, its mock exposes **no** locale key at all (neither `$.locale` nor `$.ambientLocale` — overriding either is a compile error); substitute a dependency instead.
  - Add an optional `directKit` field to `RMachine.create(...)` config to curate ambient shared resources (shell + base-gear namespaces) surfaced as `$.kit` on direct plugs.
  - Add the `valid@direct` resource-atlas catalog (base gears + shells, public namespaces only).
  - Export the `DirectPlugDefiner` and `DirectPlugKitMap` types, and the `getResFamilyFromLayoutType` helper, from `r-machine/core`.

- be0872d: Rename the `mockPlug` consumer locale-override key `$.locale` → `$.ambientLocale`, and forbid it entirely on `DirectPlug`.

  The override meant three different things behind one name, which had already produced a precedence bug. The key is now named by plug kind, enforced by type:
  - **Resource plugs** (`Shell` / `shell(mono)`, `r.plug`): keep `$.locale` — it resolves the resource **at** that locale (the override wins). Unchanged.
  - **Ambient consumers** (`Plug` / `ClientPlug` / `ServerPlug`): the key is now `$.ambientLocale` — the locale the absent ambient container (React context / request header) would have supplied; a fallback that loses to an explicitly-passed locale.
  - **`DirectPlug`**: exposes **no** locale key (neither `$.locale` nor `$.ambientLocale`) — its locale is always explicit, so overriding it is a compile error; mock a dependency instead.

  Migration: in consumer-plug tests, rename `.with({ $: { locale } })` → `.with({ $: { ambientLocale } })`. Resource-plug mocks (`mockPlug(shell.plug)`) are unchanged. Internally, `PlugOverride.locale` was renamed to `ambientLocale`.

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

## 1.0.0-alpha.11

### Patch Changes

- f7656f0: All r-machine library packages are now licensed under AGPL-3.0-only. For proprietary licensing inquiries, contact: licensing@codecarvings.com.

  ### Breaking Changes
  - **LICENSE CHANGE** `r-machine`: Package license changed from MIT to AGPL-3.0-only.
  - **LICENSE CHANGE** `@r-machine/react`: Package license changed from MIT to AGPL-3.0-only.

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

## 1.0.0-alpha.9

### Patch Changes

- 8992765: Add structured error system with typed error subclasses and error codes.

  ### Breaking Changes
  - **Change** `RMachineError` constructor to accept a `code` parameter; error message format is now `R-Machine Error [CODE]: message`.
  - **Change** `validateRMachineConfig` to return `RMachineConfigError` with specific error codes instead of generic `RMachineError`.
  - **Change** `validateLocale` in `LocaleHelper` to return `RMachineConfigError` with `ERR_UNKNOWN_LOCALE`.
  - **Change** `validateCanonicalUnicodeLocaleId` to return `RMachineConfigError` with `ERR_INVALID_LOCALE_ID`.
  - **Change** resource resolve errors in `RModule` to throw `RMachineResolveError` with `ERR_RESOLVE_FAILED`.
  - **Change** `RMachine.pickR` and `RMachine.pickRKit` to throw `RMachineUsageError` with `ERR_UNKNOWN_LOCALE` on invalid locale.

  ### Added
  - Add `RMachineConfigError`, `RMachineResolveError` and `RMachineUsageError` subclasses of `RMachineError`.
  - Add error codes: `ERR_NO_LOCALES`, `ERR_DUPLICATE_LOCALES`, `ERR_INVALID_LOCALE_ID`, `ERR_DEFAULT_LOCALE_NOT_IN_LIST`, `ERR_UNKNOWN_LOCALE`, `ERR_RESOLVE_FAILED`.

  ### Fixed
  - **Fix** `getResolveRFromModuleError` to pass `$.locale` instead of `$.namespace` as locale argument.
  - **Fix** `canonicalizeUnicodeLocaleId` to simplify canonicalization logic removing redundant leading-hyphen check.

## 1.0.0-alpha.8

### Patch Changes

- 2b714c4: Complete refactoring of types, functions and classes to support the new "PathAtlas" feature.

  ### Breaking Changes
  - **Rename** `AnyAtlas` interface to `AnyResourceAtlas`.
  - **Rename** `AtlasNamespace<A>` type to `Namespace<RA>`.
  - **Rename** `AtlasNamespaceList<A>` type to `NamespaceList<RA>`.
  - **Change** `RMachine` class generic parameter from `A extends AnyAtlas` to `RA extends AnyResourceAtlas`.
  - **Change** `Strategy` base class: now requires an `RMachine` instance as first constructor parameter and accepts a new `RA` (ResourceAtlas) generic parameter. Signature changed from `Strategy<C>` to `Strategy<RA, C>`.
  - **Change** `hybridPickR` and `hybridPickRKit` methods on `RMachine` from public to `protected`.
  - **Remove** `ImplProvider`, `ImplFactory`, `AnyImpl` types and `getImplFactory` function (the entire `impl.ts` module).
  - **Change** barrel exports from wildcard `export * from` statements to explicit named exports.

  ### Added
  - Add `validateConfig` hook method to `Strategy` base class.

## 1.0.0-alpha.6

### Patch Changes

- 5288e2c: Change behaviour of RMachine methods pickR, hybridPickR, pickRKit and hybridPickRKit so that the provided locale param is validated before use and is not mapped via the localeMapper method;
  Remove LocaleMapperManager class;
  Remove localeMapper option from RMachineConfig interface.

## 1.0.0-alpha.5

### Patch Changes

- 99e56a5: Add hybridPickR and hybridPickRKit methods to rMachine;
  Add r-machine/strategy/web export path;
  Add SwitchableOption;
  Change return type of rMachine methods pickR and pickRKit to Promise<>;
  Change CustomLocaleDetector and CustomLocaleStore to allow returning Promises;
  Remove Bin types.

## 1.0.0-alpha.4

### Patch Changes

- 315569e: Renamed subpath export path from "common" to "errors"
- 315569e: Added CustomLocaleDetector and CustomLocaleStore types.
  Removed Strategy.getConfig static method.

## 1.0.0-alpha.3

### Patch Changes

- 67952cd: Add base strategy implementation to R-Machine library

## 1.0.0-alpha.2

### Patch Changes

- 7ffa541: Add changeset

## 1.0.0-alpha.1

### Patch Changes

- b57d000: Initial release
