---
"r-machine": patch
---

Add structured error system with typed error subclasses and error codes.

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
