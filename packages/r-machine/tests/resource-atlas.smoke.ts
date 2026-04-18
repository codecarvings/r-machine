/**
 * Smoke test (type-only) for defineLayout. Not executed as unit tests yet —
 * purpose is to confirm the new primitive compiles and produces the expected
 * types in a realistic usage pattern. Lives outside src/ so zshy doesn't
 * include it in the build.
 */

import type { ReactiveGearTag } from "../src/core/index.js";
import type { AnyResAtlasClass, ValidBridgeGearItem } from "../src/lib/index.js";
import { defineLayout } from "../src/lib/index.js";

// Fake resource shapes — the point is type structure, not real instances.
interface Gear_Counter {
  readonly kind: "counter";
}
interface Gear_Cart {
  readonly kind: "cart";
}
// A "reactive" gear: same shape as a regular gear plus the ReactiveGearTag
// brand. Shapes the atlas to mimic what `.reactive(...)` composers produce.
interface Gear_Live extends ReactiveGearTag {
  readonly tick: number;
}
interface Shell_Common {
  readonly greeting: string;
}
interface Shell_Lib_Fmt {
  readonly number: (n: number) => string;
}
interface Vertex_Main {
  readonly kind: "vertex";
}

// 1) defineLayout preserves the literal layout shape.
const layout = defineLayout({
  gear: "gear",
  vertex: "vertex-gear",
  shell: "shell",
  "shell/lib": "dynamic-shell",
});

// 2) Valid atlas: class extends layout<{...}>() compiles.
export class ResourceAtlas extends layout<{
  "gear/counter": Gear_Counter;
  "gear/cart": Gear_Cart;
  "gear/live": Gear_Live;
  "vertex/main": Vertex_Main;
  "shell/common": Shell_Common;
  "shell/lib/fmt": Shell_Lib_Fmt;
}>() {}

// 3) The class carries the layout as a static.
const staticLayout = ResourceAtlas.layout;
type _StaticLayoutIsLiteral = typeof staticLayout extends { readonly gear: "gear" } ? true : never;
const _1: _StaticLayoutIsLiteral = true;

// 4) Layout properties are also accessible on the callable itself (runtime
// introspection path).
const _gearPrefix: "gear" = layout.gear;
const _vertexPrefix: "vertex-gear" = layout.vertex;
const _shellPrefix: "shell" = layout.shell;
const _dynamicShellPrefix: "dynamic-shell" = layout["shell/lib"];

// 5) AnyResAtlasClass bound accepts the produced class.
function acceptsAtlas<A extends AnyResAtlasClass>(_atlas: A): void {}
acceptsAtlas(ResourceAtlas);

// 6) Hover probe: a function whose parameter is typed via the class name
// should display "ResourceAtlas" in hover tooltips, not the expanded shape.
// (Manual verification in the IDE; no assertion expressible here.)
declare function useAtlas<A extends AnyResAtlasClass>(atlas: A): InstanceType<A>;
const _atlasInstance = useAtlas(ResourceAtlas);
// Hover `_atlasInstance`: should be a compact type, not a wall of text.

// 7) Instance exposes sub-atlas maps (namespace → resource type) per family.
// Note: "dynamic-shell" is collapsed into `shell` at type level; "vertex-gear"
// has no sub-atlas (vertex gears cannot be used as deps — see ResAtlasInstance
// doc in resource-atlas.ts). Vertex gears live only in `res` (the full atlas).
type _Instance = InstanceType<typeof ResourceAtlas>;
type _GearMap = _Instance["gear"];
//           ^? { "gear/counter": Gear_Counter; "gear/cart": Gear_Cart }
type _ShellMap = _Instance["shell"];
//           ^? { "shell/common": Shell_Common; "shell/lib/fmt": Shell_Lib_Fmt }
type _Resources = _Instance["res"];
//           ^? full atlas (includes vertex/main too)

// Key unions are obtained via `keyof` (what composer .deps() constraints use).
type _GearKeys = keyof _GearMap;
type _ShellKeys = keyof _ShellMap;

const _gearKey: _GearKeys = "gear/counter";
const _gearKey2: _GearKeys = "gear/cart";
const _shellKey: _ShellKeys = "shell/common";
const _dynamicShellAsShell: _ShellKeys = "shell/lib/fmt";

// Resource type lookup via sub-map or via res (both yield the same type).
const _gearResourceViaSubMap: _GearMap["gear/counter"] = { kind: "counter" };
const _gearResourceViaRes: _Resources["gear/counter"] = { kind: "counter" };

// Vertex gears are in `res` but NOT in `gear` sub-map.
const _vertexInRes: _Resources["vertex/main"] = { kind: "vertex" };
// @ts-expect-error — vertex/main is not in the gear sub-map
const _vertexInGear: _GearMap["vertex/main"] = { kind: "vertex" };

// 8) Invalid: key whose prefix is not in the layout.
//    Expected: branded RMachineTypeError with readable message.
//    Uncomment to observe the error message in your IDE.
//
// export class BadAtlas1 extends layout<{
//   "unknown/x": Gear_Counter; // ← Error contains "'unknown/x' has no matching prefix"
// }>() {}

// 9) Invalid: bare top-level key without sub-path.
//    Expected: branded RMachineTypeError with "must be a sub-path" message.
//
// export class BadAtlas2 extends layout<{
//   "gear": Gear_Counter; // ← Error contains "must be a sub-path"
// }>() {}

// 10) ValidBridgeGearItem outcomes:
//     - valid (gear namespace) → namespace passes through
//     - non-gear (shell, vertex, unknown) → branded error "is not a valid gear"
//
//     Note: reactive gears ARE accepted here at compile time — the historical
//     reactive-brand check was removed because probing the gear's value type
//     (to detect ReactiveGearTag via `keyof`) forces TS to resolve the type
//     structurally, which cycles under the common `Gear_X = RShape<typeof r>`
//     self-referential pattern. Passing a reactive gear as a bridge is out of
//     contract; no runtime guard either.
type _ValidBridge = ValidBridgeGearItem<InstanceType<typeof ResourceAtlas>, "gear/counter">;
//     ^? "gear/counter"
type _ReactiveBridgeNowAccepted = ValidBridgeGearItem<InstanceType<typeof ResourceAtlas>, "gear/live">;
//     ^? "gear/live"  (no longer rejected)
type _ShellBridge = ValidBridgeGearItem<InstanceType<typeof ResourceAtlas>, "shell/common">;
//     ^? RMachineTypeError<`Namespace 'shell/common' is not a valid gear namespace.`>

const _validBridge: _ValidBridge = "gear/counter";
const _reactiveBridgePassesThrough: _ReactiveBridgeNowAccepted = "gear/live";
// @ts-expect-error — shell is not a valid gear, branded error
const _shellBridgeIsNotString: _ShellBridge = "shell/common";

// Silence "unused" warnings in this scratch/smoke file.
export const _probes = {
  _1,
  _gearPrefix,
  _vertexPrefix,
  _shellPrefix,
  _dynamicShellPrefix,
  _atlasInstance,
  _gearKey,
  _gearKey2,
  _shellKey,
  _dynamicShellAsShell,
  _gearResourceViaSubMap,
  _gearResourceViaRes,
  _vertexInRes,
  _vertexInGear,
  _validBridge,
  _reactiveBridgePassesThrough,
  _shellBridgeIsNotString,
};
export type _Exports = {
  staticLayout: typeof staticLayout;
  gearMap: _GearMap;
  shellMap: _ShellMap;
  gearKeys: _GearKeys;
  shellKeys: _ShellKeys;
  resources: _Resources;
};
