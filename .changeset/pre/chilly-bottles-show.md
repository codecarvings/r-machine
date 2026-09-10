---
"@r-machine/next": patch
---

Complete refactoring of types, functions and classes to support the new "PathAtlas" feature.

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
