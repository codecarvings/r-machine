---
"@r-machine/testing": patch
---

Fix `mockPlug` throwing `ERR_CIRCULAR_DEPENDENCY` when mocking a kit-resident resource (e.g. a shell registered in a machine-wide `shellKit`).

A kit can carry deferred cycle-breaker getters for self/recursive references (`$.kit.<self>`). Those getters throw by design while their own slot is still mid-resolution — a cycle that is broken and invisible at runtime, since nothing ever reads them. But `mockPlug`'s state-binding scan walked every kit entry eagerly during the mocked plug's own resolve, tripping the getter at exactly the moment it must throw. Mocking any kit-resident shell (such as a `fmt` formatter shell) blew up even though the same resolve succeeds in production.

The scan now tolerates a kit entry that throws on access and skips it: a still-resolving deferred entry can't be a resolved stateful surface, so it contributes nothing to bind. Ready kit entries still bind normally. Testing-layer only — no runtime/core behavior change.
