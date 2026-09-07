---
"@r-machine/next": patch
---

**LICENSE CHANGE**: Package license changed from MIT to AGPL-3.0-only. Add structured error handling with typed errors and error codes.

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
