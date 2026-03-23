# r-machine

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
