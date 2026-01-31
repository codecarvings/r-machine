---
"r-machine": patch
---

Complete refactoring of types, functions and classes to support the new "PathAtlas" feature.

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
