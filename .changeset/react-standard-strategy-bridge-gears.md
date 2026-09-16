---
"@r-machine/react": patch
---

Fix `ReactStandardStrategy.create` rejecting a machine configured with `bridgeGears`.

The React strategy constrained its equipment generic as `E extends ResEquipment<RA>`, which fills the remaining parameters with their defaults — including `BGL = []`. Any `RMachine.create({ bridgeGears: [...] })` with a non-empty list therefore failed at the `create` call site (`Type '["base/…"]' is not assignable to type '[]'`), even though it worked at runtime. The constraint is now `AnyResEquipment<RA>`, matching `RMachine` and the Next strategies. Workarounds such as a `@ts-expect-error` on the `create` call can be removed — with the fix in place they become an unused-directive error.
