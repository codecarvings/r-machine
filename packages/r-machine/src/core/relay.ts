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

import { type Cmd, isCmd } from "./cmd.js";
import { type EqualsStrategy, resolveEquals } from "./comparer.js";
import { getMemberName, setMemberName } from "./member-name.js";
import type { CassetteRecorder, RelayRuntime } from "./reactivity/cassette-recorder.js";
import type { AnyNamespace } from "./res-domain.js";

// biome-ignore lint/suspicious/noConfusingVoidType: This is intentional
type RelayOnChangeResult = void | Cmd | Cmd[];

type RelayEquals<T> = EqualsStrategy | ((current: T, prev: T) => boolean);

interface RelayConfig<T> {
  readonly select: () => T;
  readonly onChange: (current: T, prev: T) => RelayOnChangeResult | Promise<RelayOnChangeResult>;
  /**
   * Optional equality check between the current and previous selected values.
   * When it returns `true` the values are considered equivalent and `onChange`
   * does NOT fire. Either a built-in strategy name (`"identity"` | `"shallow"`)
   * or a custom comparator. Defaults to `"identity"` (`Object.is`).
   */
  readonly equals?: RelayEquals<T>;
}

const relayBrand: unique symbol = Symbol("relay");
export interface RelayBrand {
  readonly [relayBrand]: true;
}
export interface Relay<T> extends RelayConfig<T>, RelayBrand {}

export type AnyRelay = Relay<any>;

export function isRelay(v: unknown): v is AnyRelay {
  return typeof v === "object" && v !== null && relayBrand in v;
}

export function createRelay<T>(config: RelayConfig<T>, name: string = "relay"): Relay<T> {
  const relay = { ...config };
  Object.defineProperty(relay, relayBrand, { value: true });
  setMemberName(relay, name);
  return relay as Relay<T>;
}

export type RelayComposer = <T>(config: RelayConfig<T>) => Relay<T>;

const UNSET: unique symbol = Symbol("relay-prev-unset");

/**
 * Per-relay runtime: owns a private cassette, tracks the value returned by
 * `select`, and fires `onChange(next, prev)` only when `!equals(next, prev)`,
 * where `equals` is the relay's optional comparator (default `Object.is`).
 *
 * The relay registers internal subscribers on every dep captured by `select`.
 * When a dep mutates, the recorder marks the relay dirty; the outermost
 * action's flush walks dirty relays in registration order and calls
 * `runIfDirty()` on each. Initial registration captures deps and seeds
 * `prev` WITHOUT calling `onChange` (semantics: react to changes, not to
 * existence).
 *
 * Step 1: returned cmds are ignored; returned Promises are ignored.
 * Step 3 will dispatch returned cmds and handle async onChange.
 */
export function createRelayRuntime(
  relay: AnyRelay,
  recorder: CassetteRecorder,
  namespace?: AnyNamespace
): { dispose(): void } {
  const cassette = recorder.createCassette();
  const equals = resolveEquals(relay.equals);
  let prev: unknown | typeof UNSET = UNSET;
  let depUnsubs: Array<() => void> = [];
  let disposed = false;
  let unregister: (() => void) | undefined;

  const runtime: RelayRuntime = {
    runIfDirty() {
      const relayName = getMemberName(relay);
      if (disposed) {
        return { cmds: [], relayName };
      }
      // Re-capture deps; if select throws, swallow + emit, preserve prev.
      for (const unsub of depUnsubs) {
        unsub();
      }
      depUnsubs = [];
      let next: unknown;
      try {
        cassette.insert();
        try {
          next = relay.select();
        } finally {
          cassette.eject();
        }
      } catch (e) {
        recorder.emitRelayError(relayName, e);
        // Re-subscribe to deps from the last successful capture so we still
        // react to future mutations. Since cassette.insert() cleared the
        // deps, getDeps() is empty here — but that's acceptable: the next
        // action that mutates a previously-known dep won't fire this relay.
        // Users with a throwing select() get a documented event and a relay
        // that effectively stalls until the next successful select() pass.
        return { cmds: [], relayName };
      }
      for (const dep of cassette.getDeps()) {
        depUnsubs.push(
          dep.subscribeInternal(() => {
            if (!disposed) {
              recorder.markRelayDirty(runtime);
            }
          })
        );
      }
      if (prev !== UNSET && equals(next, prev)) {
        return { cmds: [], relayName };
      }
      const prevForCallback = prev === UNSET ? next : prev;
      prev = next;
      let result: unknown;
      try {
        result = relay.onChange(next, prevForCallback);
      } catch (e) {
        recorder.emitRelayError(relayName, e);
        return { cmds: [], relayName };
      }
      return extractSyncResult(result, relayName, recorder);
    },
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      for (const unsub of depUnsubs) {
        unsub();
      }
      depUnsubs = [];
      unregister?.();
    },
  };

  // Initial pass: capture deps + seed prev WITHOUT calling onChange.
  try {
    cassette.insert();
    try {
      prev = relay.select();
    } finally {
      cassette.eject();
    }
  } catch (e) {
    recorder.emitRelayError(getMemberName(relay), e);
    // prev stays UNSET; first successful runIfDirty will seed and not fire
    // (Object.is on UNSET-sentinel handled above).
  }
  for (const dep of cassette.getDeps()) {
    depUnsubs.push(
      dep.subscribeInternal(() => {
        if (!disposed) {
          recorder.markRelayDirty(runtime);
        }
      })
    );
  }
  unregister = recorder.registerRelay(runtime, namespace);

  return { dispose: () => runtime.dispose() };
}

/**
 * Parses the user's onChange return value into the sync portion (cmds to be
 * dispatched in Phase 2 of the current flush) and schedules any Promise
 * result as an out-of-band cycle. The sync cmds are returned to the
 * recorder; the async path is fully handled here.
 *
 * Out-of-band semantics: when onChange returns a Promise, the relay does
 * NOT block the current flush. The Promise is awaited via a microtask;
 * once it resolves, any returned cmds are dispatched inside a fresh
 * `runInTransaction`, which triggers a separate flush cycle. Rejections
 * are swallowed and reported as `relay:onChangeError`.
 */
function extractSyncResult(
  result: unknown,
  relayName: string,
  recorder: CassetteRecorder
): { cmds: readonly Cmd[]; relayName: string } {
  if (result == null) {
    return { cmds: [], relayName };
  }
  if (isThenable(result)) {
    // Out-of-band: do NOT await synchronously. Schedule on microtask;
    // resolved value's cmds are dispatched as a new tx (separate flush).
    void result.then(
      (resolved) => {
        const cmds = normalizeCmds(resolved);
        if (cmds.length === 0) {
          return;
        }
        recorder.runInTransaction(() => {
          for (const cmd of cmds) {
            try {
              cmd.action(...cmd.payload);
            } catch (e) {
              recorder.emitRelayError(relayName, e);
            }
          }
        });
      },
      (e) => {
        recorder.emitRelayError(relayName, e);
      }
    );
    return { cmds: [], relayName };
  }
  return { cmds: normalizeCmds(result), relayName };
}

function isThenable(v: unknown): v is PromiseLike<unknown> {
  return typeof v === "object" && v !== null && typeof (v as { then?: unknown }).then === "function";
}

function normalizeCmds(v: unknown): Cmd[] {
  if (v == null) {
    return [];
  }
  if (Array.isArray(v)) {
    return v.filter(isCmd);
  }
  if (isCmd(v)) {
    return [v];
  }
  return [];
}
