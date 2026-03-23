# @r-machine/next

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
