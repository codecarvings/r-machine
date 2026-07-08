---
"r-machine": patch
"@r-machine/testing": patch
---

Fix: a plain `get` accessor on a resource is now kept live on its surface instead of being snapshotted at instantiation.

A gear member written as a bare JS accessor — `get availableDiskSpace() { return $.ports.stat() }` — was read **once** when the surface was built and frozen as a value, so a consumer reading it repeatedly always got the instantiation-time snapshot. Now `buildSurface` (and `buildTestSurface`, behind `ctrl.createRes()`) inspects the property **descriptor** and transplants a `get` accessor as a live accessor, so it is re-evaluated on every read — the fresh-on-read behaviour a plain getter is expected to have.

Gears are not only reactive containers: a member can be a plain getter that reads a port and must return a current value each call. `_.getter`/`_.cell` remain the reactive primitives (tracked, drive re-renders); a plain `get` is now correctly live but non-reactive. Branded `_.getter`/`_.cell` members and plain data values are unaffected.
