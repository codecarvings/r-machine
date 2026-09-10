---
"r-machine": patch
"@r-machine/react": patch
"@r-machine/next": patch
---

Retire the `experimental.outerGear` flag — `OuterGear` and `VertexFrame` are now unconditional.

`OuterGear` (and, on the React/Next side, `VertexFrame`) were withheld from the toolsets until `experimental: { outerGear: "on" }` was passed to `RMachine.create(...)`. The feature has stabilized, so the flag is gone and both are always part of the surface. The `experimental` option itself stays — it is the reserved namespace for the next opt-in feature — but no flag is defined right now.

### Changed

- `OuterGear` is always present on `rMachine.createToolset()`, and `VertexFrame` on the React bare/standard toolsets and the Next client toolset. Remove `experimental: { outerGear: "on" }` from your `RMachine.create(...)` call — with no flag declared, `ExperimentalFlags` rejects every key, so leaving it in place is now a type error rather than a silently ignored option.
- A layout with `gear:outer` entries no longer needs an opt-in, so `validateRMachineConfig` no longer rejects one.

### Removed

- `ERR_EXPERIMENTAL_OUTER_GEAR_REQUIRED` — the error it reported can no longer occur.

### Added

- `ExperimentalTools<EF>` (exported from `r-machine/core`) — the type-level seam each toolset intersects with, so that a future flag contributes its tools to the surface it belongs to. With no flag declared it resolves to `{}` and toolset shapes are unchanged.
