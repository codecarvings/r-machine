# @r-machine/react

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
