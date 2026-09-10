---
"@r-machine/next": patch
---

Export `localeHeaderName` from `@r-machine/next/core`.

### Added

- **`localeHeaderName`** — the request header the proxy writes the resolved locale into, and the server toolset reads back, when `autoLocaleBinding` is on. It was already the contract between those two halves but had no public name, so app code holding the request headers — a route handler, an instrumentation hook, anything outside a plug — had to hardcode the string. The constant moved from the app strategy core up to `core/proxy.ts`, next to `RMachineProxy`: it is part of the proxy's contract, and that barrel is the published one. Its type is the literal `"x-rm-locale"`, not `string`.
