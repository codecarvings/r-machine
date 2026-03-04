---
"@r-machine/react": patch
---

Add structured error handling with typed errors and error codes.

### Breaking Changes

- **Change** `ReactBareToolset` and `ReactToolset` to throw `RMachineUsageError` with `ERR_CONTEXT_NOT_FOUND` when context is missing.
- **Change** `ReactBareToolset` to throw `RMachineUsageError` with `ERR_MISSING_WRITE_LOCALE` when no `writeLocale` function is provided.
- **Change** locale validation errors in `ReactBareToolset`, `ReactToolset` and `ReactStandardImpl` to throw `RMachineUsageError` with `ERR_UNKNOWN_LOCALE` instead of generic `RMachineError`.

### Added

- Add `@r-machine/react/errors` export path with `ERR_CONTEXT_NOT_FOUND` and `ERR_MISSING_WRITE_LOCALE` error codes.
