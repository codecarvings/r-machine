---
"r-machine": patch
---

Add `DirectPlug` — a container-free, framework-neutral consumer plug on the core toolset.

`DirectPlug` connects directly to R-Machine without a strategy (React/Next) in between: the locale is passed explicitly to `useR(locale)`, resolution is async, and it carries no locale container. It can be used anywhere — server components, client handlers, queue workers, cron jobs — which makes the `r-machine` core usable standalone (without `@r-machine/react` or `@r-machine/next`) for the stateless subset of resources.

### Added

- Add `DirectPlug` to the toolset returned by `rMachine.createToolset()`. Its dependency scope is `valid@direct` (shells + base gears only) — exactly the resources whose resolution is a pure function of locale. The `$` context exposes `{ locale, kit }` (a read-only echo of the passed locale; no `setLocale`/`getPath`/`params`). Single-resource, list, and map call forms are supported; resolution goes through the single-shot `getGatePlugin` path (no persistent wire). `mockPlug` works on it uniformly — note that since a direct plug's locale is always explicit, its mock exposes **no** locale key at all (neither `$.locale` nor `$.ambientLocale` — overriding either is a compile error); substitute a dependency instead.
- Add an optional `directKit` field to `RMachine.create(...)` config to curate ambient shared resources (shell + base-gear namespaces) surfaced as `$.kit` on direct plugs.
- Add the `valid@direct` resource-atlas catalog (base gears + shells, public namespaces only).
- Export the `DirectPlugDefiner` and `DirectPlugKitMap` types, and the `getResFamilyFromLayoutType` helper, from `r-machine/core`.
