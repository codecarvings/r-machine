---
"@r-machine/testing": patch
"r-machine": patch
---

Add `ctrl.createRes()` for resource tests, make resource instantiation engine-internal, and give every resource family an idempotent dispose.

**`ctrl.createRes()` + `TestSurface`.** A resource mock (`mockPlug(r)`) now exposes `createRes()` on its controller: it instantiates the mocked resource (overrides applied) and returns its **`TestSurface`** — the *same* shape a dependency is mocked in, so both sides of a test speak one language. A **getter or cell reads as a property** (`cart.subtotal`, not `cart.subtotal()`); actions stay callable and return the resulting state; relays, `$`-members and `Symbol.dispose` are retained (a consumer's surface hides those). The method is present **only** when a `ResMatrix` is passed to `mockPlug` — a consumer is rendered, not instantiated, so its controller has no `createRes`.

**Instantiation is engine-internal.** R-Machine resources are built by the engine on demand — never by application code. The public `r.create()` / `r.createSync()` are removed (moved behind module-private symbols); the only sanctioned direct instantiation is a test, via `ctrl.createRes()`. A new internal seam `instantiateRes` / `instantiateResSync` is exported from `r-machine/core` for the engine and the testing layer.

**Auto-dispose.** The controller auto-disposes every instance `createRes()` created when it resets, so `using ctrl` alone tears the instance down too (a `createRes` instance is not a resolved slot, so a forgotten teardown — e.g. a `setInterval` or a relay subscription — would otherwise leak across tests).

**Bug fix — uniform idempotent dispose.** A resource's `[Symbol.dispose]` is now idempotent across **every** family (OuterGear, Base/Inner gear, Shell), enforced at the single instantiation point. Previously only OuterGear guarded re-entry (via relay cleanup); Base/Inner/Shell returned a raw dispose. This also lets the auto-dispose compose safely with an explicit `using inst`.

Migration (tests only): `const x = await r.create()` → `using ctrl = mockPlug(r).…; const x = await ctrl.createRes()`, and drop the `()` on getter/cell reads (`x.total()` → `x.total`). Consumer tests (rendered components) are unchanged.
