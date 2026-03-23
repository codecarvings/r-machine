# @r-machine/react

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
