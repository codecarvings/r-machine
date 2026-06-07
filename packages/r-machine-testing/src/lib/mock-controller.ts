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

import {
  type AnyListPlugHead,
  type AnyMapPlugHead,
  type AnyPlugHead,
  type DeepPartial,
  deepPartialMerge,
  type ExtractKit,
  type ExtractNamespace,
  type ExtractResAtlas,
  type ExtractState,
  getPlugHead,
  type Handle,
  type PlugBody,
  type StateCell,
  type StatefulOuterStateMap,
  tryGetStateAccess,
} from "r-machine/core";
import { RMachineUsageError } from "r-machine/errors";
import { ERR_STATE_NOT_RESOLVED } from "#r-machine/testing/errors";

// Controller for a single stateful resource (a dep or a kit entry): read/write
// its live state. A standalone interface so future controls (actions, getters,
// …) can be added without touching the crossing logic below.
//
// Asymmetric on purpose: READ the full state `S`, WRITE a `DeepPartial<S>` patch
// (deep-partial merge, arrays replaced wholesale) — the same shape an action
// reducer returns, so driving state from a test mirrors R-Machine's own model.
interface MockStateController<S> {
  get state(): S;
  set state(value: DeepPartial<S>);
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

// When the MOCKED plug is itself a stateful OuterGear, expose `state` to
// read/write that gear's own state directly. `ExtractState<PH>` yields the
// state type for a stateful outer-gear head and `undefined` otherwise (no
// `defaultState`), so non-stateful plugs contribute no `state` member. Read the
// full state, write a deep-partial patch (see `MockStateController`).
type OwnState<PH extends AnyPlugHead> = [ExtractState<PH>] extends [undefined]
  ? {}
  : { get state(): ExtractState<PH>; set state(value: DeepPartial<ExtractState<PH>>) };

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

// Live read/write handle to one stateful OuterGear's state. Backed by an entry
// in the binding table: before the plug resolves there is no cell, so a write
// is queued as a `seed` (applied once when the cell is bound at resolve time).
//
// `set state` is a DEEP-PARTIAL MERGE onto the current state (arrays replaced
// wholesale) — the SAME semantics as an action reducer returning a partial, so
// `ctrl.state = { lines }` keeps the other keys, mirroring R-Machine's model.
//
// `get state` therefore THROWS before the plug is resolved: the queued seed is a
// partial patch, not the full state `S`, so the full value only exists once the
// cell is bound (default merged with the accumulated patches).
interface Entry {
  cell?: StateCell<unknown>;
  seed?: unknown;
  hasSeed: boolean;
}

interface StateHandle {
  state: unknown;
}

interface StateBinding {
  // Bind cells from a freshly-resolved plugin (called by the mock transform on
  // every resolve). Idempotent; the seed is applied only on the FIRST bind.
  readonly bind: (plugin: unknown) => void;
  // Drop all bound cells + queued seeds (called on reset()).
  readonly clear: () => void;
  // Build the controller object, injecting the reset() built by mockPlug.
  readonly makeController: (reset: () => void) => Record<string, unknown>;
}

export function createStateBinding(plug: PlugBody<AnyPlugHead>): StateBinding {
  const head = getPlugHead(plug) as unknown as {
    nsDeps?: Record<string, unknown>;
    nsDepList?: readonly unknown[];
  };
  // Declared dep keys (map names). For list plugs deps are positional, derived
  // from the resolved plugin's length instead.
  const depNames = head.nsDeps !== undefined ? Object.keys(head.nsDeps).filter((k) => k !== "$") : [];

  const table = new Map<string, Entry>();
  const getEntry = (key: string): Entry => {
    let e = table.get(key);
    if (e === undefined) {
      e = { hasSeed: false };
      table.set(key, e);
    }
    return e;
  };

  const read = (key: string): unknown => {
    const e = getEntry(key);
    if (e.cell !== undefined) {
      return e.cell.peek();
    }
    throw new RMachineUsageError(
      ERR_STATE_NOT_RESOLVED,
      "Cannot read `.state` before the plug was resolved. Render (or resolve) the plug first."
    );
  };

  const write = (key: string, value: unknown): void => {
    const e = getEntry(key);
    if (e.cell !== undefined) {
      e.cell.publish(deepPartialMerge(e.cell.peek(), value));
    } else {
      // Accumulate partials so multiple pre-resolve writes compose.
      e.seed = e.hasSeed ? deepPartialMerge(e.seed, value) : value;
      e.hasSeed = true;
    }
  };

  // Attach a resolved surface/ctx's live cell to its entry; apply a queued seed
  // exactly once (re-binding the same cell on later resolves must NOT clobber
  // state already mutated by actions/handle).
  const bindKey = (key: string, target: unknown): void => {
    if (target === null || typeof target !== "object") {
      return;
    }
    const cell = tryGetStateAccess(target);
    if (cell === undefined) {
      return;
    }
    const e = getEntry(key);
    e.cell = cell;
    if (e.hasSeed) {
      // Deep-partial merge the queued seed onto the freshly-resolved state.
      cell.publish(deepPartialMerge(cell.peek(), e.seed));
      e.hasSeed = false;
    }
  };

  const bind = (plugin: unknown): void => {
    let ctx: unknown;
    if (Array.isArray(plugin)) {
      const last = plugin.length - 1;
      for (let i = 0; i < last; i++) {
        bindKey(`dep:${i}`, plugin[i]);
      }
      ctx = plugin[last];
    } else if (plugin !== null && typeof plugin === "object") {
      const obj = plugin as Record<string, unknown>;
      for (const name of depNames) {
        bindKey(`dep:${name}`, obj[name]);
      }
      ctx = obj.$;
    }
    // Own state: a stateful OuterGear resource's resolve output carries its cell
    // on `$` (set in augmentCtx). For a consumer `$` it is absent → no-op.
    bindKey("own", ctx);
    // Kit entries (client kits may hold stateful outer gears) live on `$.kit`.
    const kit = ctx !== null && typeof ctx === "object" ? (ctx as Record<string, unknown>).kit : undefined;
    if (kit !== null && typeof kit === "object") {
      for (const name of Object.keys(kit as Record<string, unknown>)) {
        bindKey(`kit:${name}`, (kit as Record<string, unknown>)[name]);
      }
    }
  };

  const makeHandle = (key: string): StateHandle => ({
    get state() {
      return read(key);
    },
    set state(value: unknown) {
      write(key, value);
    },
  });

  // `deps`/`kit` are Proxies that mint a handle on access: kit keys aren't on
  // the head, and list-dep keys are numeric — a Proxy covers both without
  // enumerating keys up front. The type layer (MockMapController) exposes only
  // the stateful keys, so an out-of-band access is invisible to users.
  const handleProxy = (prefix: string): Record<string, StateHandle> =>
    new Proxy({} as Record<string, StateHandle>, {
      get: (_t, key) => (typeof key === "string" ? makeHandle(`${prefix}:${key}`) : undefined),
    });

  const makeController = (reset: () => void): Record<string, unknown> => ({
    reset,
    deps: handleProxy("dep"),
    kit: handleProxy("kit"),
    // Own state (present in the type only for a stateful OuterGear plug).
    get state() {
      return read("own");
    },
    set state(value: unknown) {
      write("own", value);
    },
  });

  return { bind, clear: () => table.clear(), makeController };
}
