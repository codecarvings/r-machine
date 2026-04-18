/**
 * Copyright (c) 2026 Sergio Turolla
 *
 * This file is part of r-machine, licensed under the
 * GNU Affero General Public License v3.0 (AGPL-3.0-only).
 *
 * You may use, modify, and distribute this file under the terms
 * of the AGPL-3.0. See LICENSE in this package for details.
 *
 * If you need to use this software in a proprietary project,
 * contact: licensing@codecarvings.com
 */

import type { AnyResAtlasInstance, AnyResLayout, ResLayoutEntryType, ResolveLayoutType } from "#r-machine/core";

// Re-exported from core so public `lib` consumers can keep importing
// AnyResAtlasInstance from the top-level entrypoint. The canonical definition
// lives in core/res-atlas.ts (composers in core need it and core may not
// depend on lib).
export type { AnyResAtlasInstance };

// #region Type-error brand

// Branded error helper surfaced in TypeScript diagnostics. When a constraint
// resolves to RMachineTypeError<"…">, the message appears inline in the error,
// making the failure self-explanatory instead of an opaque structural mismatch.
export type RMachineTypeError<Msg extends string> = {
  readonly __rMachineTypeError: Msg;
};

// #endregion

// #region Atlas shape helpers

// Filters A to the subset whose keys' prefix (per LO) resolves to T.
// Uses key-remapping: the filter is string-level (never inspects A[K]),
// so computing the filtered map's keys is cycle-safe. Value evaluation
// remains lazy via indexed access on consumer side.
type ResAtlasSubMap<LO extends AnyResLayout, A, T extends ResLayoutEntryType> = {
  readonly [K in keyof A as K extends string ? (ResolveLayoutType<LO, K> extends T ? K : never) : never]: A[K];
};

// Constraint for atlas shapes. Each key must be a sub-path (e.g. "gear/foo",
// never a bare "gear") and its prefix must exist in LO. When either check
// fails the offending entry resolves to an RMachineTypeError carrying a
// readable message.
//
// The success branch returns `unknown` rather than `A[K]`. `A[K]` would be
// an identity mapping (semantically equivalent: any value is assignable to
// `unknown`), but it forces TS to evaluate `A[K]` during constraint checking,
// which breaks when atlas entries transitively reference the atlas itself
// (the common r-machine pattern: `Gear_Aggregator = ReturnType<typeof r>`
// where `r` is typed through a composer parameterized on ResourceAtlas).
// Returning `unknown` keeps the check purely at the key level.
type ValidResAtlasShape<LO extends AnyResLayout, A> = {
  readonly [K in keyof A]: K extends `${string}/${string}`
    ? [ResolveLayoutType<LO, K & string>] extends [never]
      ? RMachineTypeError<`Namespace '${K & string}' has no matching prefix in the layout. Declare a prefix in defineLayout({...}) first.`>
      : unknown
    : RMachineTypeError<`Namespace '${K & string}' must be a sub-path (e.g. 'gear/foo'), not a bare top-level key.`>;
};

// #endregion

// #region Atlas class

// Instance shape of a resource atlas class built via defineLayout(...)<A>().
// Only type-level phantom members — no runtime fields.
//
// `gear` and `shell` are pre-computed namespace unions (consumers read them
// via indexed access without re-running the filter — this breaks the cycle
// that value-based filters would trigger). `res` is the raw namespace→type
// map for resource lookup.
//
// Note 1: "dynamic-shell" is NOT a distinct family here. At type level a
// dynamic shell is indistinguishable from a regular shell (same ShellTag,
// same value shape); the "dynamic-shell" layout entry only affects runtime
// path resolution (single-file vs one-file-per-locale). Both entry types
// therefore collapse into `shell`.
//
// Note 2: "vertex-gear" is absent by design. Vertex gears cannot be used as
// dependencies by anything (Gear.deps / VertexGear.deps / Shell.deps /
// bridgeGears / gearKit / shellKit all reject them), so a precomputed union
// of vertex-gear namespaces would be dead code. Vertex gears are classified
// at runtime via the layout entry type for path resolution, nothing more.
export interface ResAtlasInstance<LO extends AnyResLayout, A> {
  readonly gear: ResAtlasSubMap<LO, A, "gear">;
  readonly shell: ResAtlasSubMap<LO, A, "shell" | "dynamic-shell">;
  readonly res: A;
}

// Constructor type: abstract class that, when extended, yields an instance
// typed as ResAtlasInstance<LO, A> and carries the layout as a static.
export type ResAtlasClass<LO extends AnyResLayout, A> = (abstract new () => ResAtlasInstance<LO, A>) & {
  readonly layout: LO;
};

// Base interface describing any atlas class produced by defineLayout.
// Used as a generic bound in public-facing APIs that accept the class as
// input (e.g. RMachineConfigParams.resourceAtlas).
// Loose instance type — concrete atlases have narrow `gear`/`shell`/`res`
// maps that collapse to `never` when evaluated against AnyResLayout, so we
// accept any instance shape and rely on call-site inference for downstream
// typing.
export type AnyResAtlasClass = (abstract new () => any) & {
  readonly layout: AnyResLayout;
};

// `AnyResAtlasInstance` (the instance shape used as generic bound in
// composers, kits, and RMachine) is defined in core/res-atlas.ts — core may
// not depend on lib, so the canonical definition lives there. Re-exported at
// the top of this file for lib consumers.

// #endregion

// #region BridgeGears

// Namespace candidates accepted by bridgeGears: any gear namespace in the
// atlas. Vertex-gears are already excluded by construction (ATLAS["gear"]
// filters them out at the layout level).
export type BridgeGearNamespace<ATLAS extends AnyResAtlasInstance> = Extract<keyof ATLAS["gear"], string>;

// Per-element validator for bridgeGears:
// - If N is not a gear namespace → branded error "not a gear"
// - Otherwise → pass through N verbatim
//
// Note on reactive gears: historically this validator also rejected reactive
// gears at compile time by inspecting the value's brand. That check required
// `keyof ATLAS["res"][N]`, which forces TS to resolve the value type — a
// structural trap under the common r-machine idiom `Gear_X = RShape<typeof r>`
// where `r` is typed through composers on the atlas, creating a transitive
// self-reference that TS cannot unfold when another part of the same config
// (bridgeGears itself) triggers evaluation. We therefore drop the reactive
// check: passing a reactive gear as a bridge is out of contract — behavior
// is undefined, no runtime guard. Aligns with the project's type-first
// principle ("bypassing types = unpredictable").
export type ValidBridgeGearItem<ATLAS extends AnyResAtlasInstance, N> =
  N extends BridgeGearNamespace<ATLAS>
    ? N
    : RMachineTypeError<`Namespace '${N & string}' is not a valid gear namespace.`>;

// Maps ValidBridgeGearItem over each element of BG. Applied as intersection
// on the bridgeGears param: `bridgeGears?: BG & ValidBridgeGears<ATLAS, BG>`
// — valid tuples pass through, invalid entries collapse to the branded
// error type and surface in the TS diagnostic inline.
export type ValidBridgeGears<ATLAS extends AnyResAtlasInstance, BG extends readonly string[]> = {
  readonly [I in keyof BG]: ValidBridgeGearItem<ATLAS, BG[I]>;
};

// #endregion

// #region Filtered kits

// gearKit values must be gear namespaces (reactive gears allowed here — only
// bridgeGears rejects reactive). Readonly string-keyed map (same shape as
// ExplicitNamespaceMap but with narrower value constraint).
export type GearKit<ATLAS extends AnyResAtlasInstance> = {
  readonly [key: string]: Extract<keyof ATLAS["gear"], string>;
};

// shellKit values must be shell namespaces OR one of the namespaces
// declared in bridgeGears (bridgeGears are already validated non-reactive
// non-vertex via ValidBridgeGears).
export type ShellKit<ATLAS extends AnyResAtlasInstance, BG extends readonly string[]> = {
  readonly [key: string]: Extract<keyof ATLAS["shell"], string> | BG[number];
};

// gateKit is scope-framework (React/Next integrations) and accepts any
// namespace of the atlas. No family filter.
export type GateKit<ATLAS extends AnyResAtlasInstance> = {
  readonly [key: string]: Extract<keyof ATLAS["res"], string>;
};

// #endregion

// #region defineLayout

// Callable returned by defineLayout: invoking `layout<A>()` produces the
// atlas class; the same value also exposes each prefix → entry-type mapping
// as a plain property for optional runtime introspection.
export type ResAtlasBuilder<LO extends AnyResLayout> = LO &
  (<const A extends ValidResAtlasShape<LO, A>>() => ResAtlasClass<LO, A>);

/**
 * Declares the namespace layout for a resource atlas and returns a callable
 * that produces the atlas class.
 *
 * @example
 * ```ts
 * const layout = defineLayout({
 *   gear: "gear",
 *   shell: "shell",
 *   "shell/lib": "dynamic-shell",
 * });
 *
 * export class ResourceAtlas extends layout<{
 *   "gear/counter": Gear_Counter;
 *   "shell/common": Shell_Common;
 * }>() {}
 * ```
 */
export function defineLayout<const LO extends AnyResLayout>(layout: LO): ResAtlasBuilder<LO> {
  function builder<const RA extends ValidResAtlasShape<LO, RA>>(): ResAtlasClass<LO, RA> {
    abstract class Base {
      static readonly layout: LO = layout;
      declare readonly gear: ResAtlasSubMap<LO, RA, "gear">;
      declare readonly shell: ResAtlasSubMap<LO, RA, "shell" | "dynamic-shell">;
      declare readonly res: RA;
    }
    return Base as unknown as ResAtlasClass<LO, RA>;
  }
  return Object.assign(builder, layout) as ResAtlasBuilder<LO>;
}

// #endregion
