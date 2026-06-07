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

import type {
  AnyListPlugHead,
  AnyMapPlugHead,
  AnyPlugHead,
  ExtractKit,
  ExtractNamespace,
  ExtractResAtlas,
  ExtractState,
  Handle,
  StatefulOuterStateMap,
} from "r-machine/core";

// Controller for a single stateful resource (a dep or a kit entry): read/write
// its live state. A standalone interface so future controls (actions, getters,
// …) can be added without touching the crossing logic below.
interface MockStateController<S> {
  state: S;
}

// The plug's atlas state map (namespace -> state, stateful outer/vertex gears
// only). Aliased so the heavy mapped-over-RD instantiation is named once and
// reused by both `deps` and `kit`.
type StatefulStates<PH extends AnyPlugHead> = StatefulOuterStateMap<ExtractResAtlas<PH>>;

// Cross a handle map (object form: key -> Handle) with a stateful-gear state map
// (SOSM). Only entries whose namespace is a stateful gear survive; each keeps its
// key and is typed on that gear's state. Used for BOTH a plug's deps and its kit
// — kits vary by plug kind (client kits can hold stateful outer gears; gear/shell
// kits hold only stateless base/shell resources, which simply drop out here).
//
// `SOSM` is a parameter so `StatefulOuterStateMap<RA>` is materialized once, not
// per key. `& keyof SOSM` re-narrows the namespace in the value position (the
// `as` key filter does not narrow it there); it is a no-op for surviving keys.
type CrossStatefulHandles<DM extends { readonly [k: string]: Handle<any> }, SOSM> = {
  [K in keyof DM as ExtractNamespace<DM[K]> extends keyof SOSM ? K : never]: MockStateController<
    SOSM[ExtractNamespace<DM[K]> & keyof SOSM]
  >;
};

// Tuple -> { [numericIndex]: element }, dropping non-numeric keys. Mirrors the
// list-deps handling in mock-plug.ts.
type TupleToObject<T extends readonly unknown[]> = {
  [K in keyof T as K extends `${number}` ? K : never]: T[K];
};

// Contributes `{ readonly [Name]: T }` only when `T` has at least one key;
// otherwise nothing. So an empty `deps`/`kit` (no stateful entries after the
// cross) vanishes from the controller entirely — a plug with nothing stateful to
// control exposes no member to reach for. Mirrors core's
// `keyof KM extends never ? {}` PluginCtx pattern.
type NonEmptyMember<Name extends string, T> = keyof T extends never ? {} : { readonly [P in Name]: T };

// When the MOCKED plug is itself a stateful OuterGear, expose a mutable `state`
// to read/write that gear's own state directly. `ExtractState<PH>` yields the
// state type for a stateful outer-gear head and `undefined` otherwise (no
// `defaultState`), so non-stateful plugs contribute no `state` member. Mutable
// by design (unlike reset/deps/kit) — the consumer reads AND writes it.
type OwnState<PH extends AnyPlugHead> = [ExtractState<PH>] extends [undefined] ? {} : { state: ExtractState<PH> };

interface MockController {
  readonly reset: () => void;
}

export type MockMapController<PH extends AnyMapPlugHead> = MockController &
  NonEmptyMember<"deps", CrossStatefulHandles<Omit<PH["deps"], "$">, StatefulStates<PH>>> &
  NonEmptyMember<"kit", CrossStatefulHandles<ExtractKit<PH>, StatefulStates<PH>>> &
  OwnState<PH>;

export type MockListController<PH extends AnyListPlugHead> = MockController &
  NonEmptyMember<
    "deps",
    CrossStatefulHandles<
      Omit<TupleToObject<PH["deps"] extends readonly unknown[] ? PH["deps"] : never>, "$">,
      StatefulStates<PH>
    >
  > &
  NonEmptyMember<"kit", CrossStatefulHandles<ExtractKit<PH>, StatefulStates<PH>>> &
  OwnState<PH>;
