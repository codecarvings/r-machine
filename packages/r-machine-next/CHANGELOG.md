# @r-machine/next

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
