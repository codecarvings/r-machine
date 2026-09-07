---
"@r-machine/testing": patch
"r-machine": patch
---

Rename the `mockPlug` consumer locale-override key `$.locale` → `$.ambientLocale`, and forbid it entirely on `DirectPlug`.

The override meant three different things behind one name, which had already produced a precedence bug. The key is now named by plug kind, enforced by type:

- **Resource plugs** (`Shell` / `shell(mono)`, `r.plug`): keep `$.locale` — it resolves the resource **at** that locale (the override wins). Unchanged.
- **Ambient consumers** (`Plug` / `ClientPlug` / `ServerPlug`): the key is now `$.ambientLocale` — the locale the absent ambient container (React context / request header) would have supplied; a fallback that loses to an explicitly-passed locale.
- **`DirectPlug`**: exposes **no** locale key (neither `$.locale` nor `$.ambientLocale`) — its locale is always explicit, so overriding it is a compile error; mock a dependency instead.

Migration: in consumer-plug tests, rename `.with({ $: { locale } })` → `.with({ $: { ambientLocale } })`. Resource-plug mocks (`mockPlug(shell.plug)`) are unchanged. Internally, `PlugOverride.locale` was renamed to `ambientLocale`.
