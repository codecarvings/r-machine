# r-machine

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
