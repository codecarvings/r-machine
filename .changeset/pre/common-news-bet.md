---
"@r-machine/react": patch
---

Complete refactoring of types, functions and classes to support the new "PathAtlas" feature.

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
