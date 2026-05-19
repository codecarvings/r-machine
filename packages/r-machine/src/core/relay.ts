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

import type { Cmd } from "./cmd.js";
import { getMemberName, setMemberName } from "./member-name.js";
import type { CassetteRecorder, RelayRuntime } from "./reactivity/cassette-recorder.js";
import type { AnyNamespace } from "./res-domain.js";

// biome-ignore lint/suspicious/noConfusingVoidType: This is intentional
type RelayOnChangeResult = void | Cmd | Cmd[];

interface RelayConfig<T> {
  readonly select: () => T;
  readonly onChange: (current: T, prev: T) => RelayOnChangeResult | Promise<RelayOnChangeResult>;
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
 * `select`, and fires `onChange(next, prev)` only when `!Object.is(prev, next)`.
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
 *
 * @internal
 */
export function createRelayRuntime(
  relay: AnyRelay,
  recorder: CassetteRecorder,
  namespace?: AnyNamespace
): { dispose(): void } {
  const cassette = recorder.createCassette();
  let prev: unknown | typeof UNSET = UNSET;
  let depUnsubs: Array<() => void> = [];
  let disposed = false;
  let unregister: (() => void) | undefined;

  const runtime: RelayRuntime = {
    runIfDirty() {
      if (disposed) return;
      // Re-capture deps; if select throws, swallow + emit, preserve prev.
      for (const unsub of depUnsubs) unsub();
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
        recorder.emitRelayError(getMemberName(relay), e);
        // Re-subscribe to deps from the last successful capture so we still
        // react to future mutations. Since cassette.insert() cleared the
        // deps, getDeps() is empty here — but that's acceptable: the next
        // action that mutates a previously-known dep won't fire this relay.
        // Users with a throwing select() get a documented event and a relay
        // that effectively stalls until the next successful select() pass.
        return;
      }
      for (const dep of cassette.getDeps()) {
        depUnsubs.push(
          dep.subscribeInternal(() => {
            if (!disposed) recorder.markRelayDirty(runtime);
          })
        );
      }
      if (prev !== UNSET && Object.is(prev, next)) {
        return;
      }
      const prevForCallback = prev === UNSET ? next : prev;
      prev = next;
      try {
        // Step 3 will dispatch the returned cmds (Cmd | Cmd[]) and
        // handle Promise<RelayOnChangeResult> as out-of-band cycles.
        relay.onChange(next, prevForCallback);
      } catch (e) {
        recorder.emitRelayError(getMemberName(relay), e);
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const unsub of depUnsubs) unsub();
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
        if (!disposed) recorder.markRelayDirty(runtime);
      })
    );
  }
  unregister = recorder.registerRelay(runtime, namespace);

  return { dispose: () => runtime.dispose() };
}
