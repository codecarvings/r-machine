---
"r-machine": patch
"@r-machine/react": patch
"@r-machine/next": patch
---

Add formatters support, locale type safety, and builder API across all packages.

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
