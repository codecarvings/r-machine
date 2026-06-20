---
"@r-machine/next": patch
---

Fix `ServerPlug` locale precedence under `mockPlug`: an explicitly-passed locale now wins over a `mockPlug` ambient-locale override.

Previously a `mockPlug` locale override always won, even when the consumer passed an explicit locale via `useR(params)` / `useR(locale)` / `useUnboundR` — contradicting the documented behavior. Now the consumer override key is `$.ambientLocale` (see the `@r-machine/testing` changeset), a **fallback**: it fills the locale only for the ambient, zero-arg `ServerPlug.useR()` (request-header-derived). When the caller passes an explicit locale, that wins and `$.ambientLocale` is a no-op — mock a dependency instead.
