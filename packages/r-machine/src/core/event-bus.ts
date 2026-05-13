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

import type { AnyLocale } from "#r-machine/locale";
import type { AnyNamespace } from "./res-domain.js";
import type { ResLayoutEntryType } from "./res-layout.js";

// ─── Macro-categories ───────────────────────────────────────────────────
// All event types follow the convention "<area>:<verb-or-state>".
// `InternalEvent` is the union emitted by the runtime managers (BPM/JM/GWM).
// Reserved for internal tests, the dev-mode logger, and a future devtools
// extension — treat as implementation detail. A separate `RuntimeEvent`
// union (user-observable: action dispatch, gear instantiation) will be
// added when those emit points exist.

// ─── Blueprint events ───────────────────────────────────────────────────

export type BlueprintEvent =
  | {
      type: "blueprint:cacheHit";
      namespace: AnyNamespace;
      locale: AnyLocale | undefined;
      layoutEntryType: ResLayoutEntryType;
    }
  | {
      type: "blueprint:resolveStart";
      namespace: AnyNamespace;
      locale: AnyLocale | undefined;
      layoutEntryType: ResLayoutEntryType;
    }
  | { type: "blueprint:moduleLoaded"; namespace: AnyNamespace; locale: AnyLocale | undefined }
  | {
      type: "blueprint:resolved";
      namespace: AnyNamespace;
      locale: AnyLocale | undefined;
      depList: readonly AnyNamespace[];
    }
  | { type: "blueprint:resolveStale"; namespace: AnyNamespace; locale: AnyLocale | undefined }
  | { type: "blueprint:resolveError"; namespace: AnyNamespace; locale: AnyLocale | undefined; error: unknown }
  // `chain` is a sequence of opaque cache keys (built by getBlueprintResCacheKey).
  // Tests usually assert on the semantic `namespace` + `locale` of the trigger;
  // the chain is preserved verbatim for log readability and debug tooling.
  | {
      type: "blueprint:circularDepDetected";
      namespace: AnyNamespace;
      locale: AnyLocale | undefined;
      chain: readonly string[];
    }
  | { type: "blueprint:evicted"; namespace: AnyNamespace; keyCount: number }
  | { type: "blueprint:moduleInvalidated"; namespace: AnyNamespace };

// ─── Juncture events ────────────────────────────────────────────────────

export type JunctureEvent =
  | { type: "juncture:cacheHit"; namespace: AnyNamespace; locale: AnyLocale | undefined; generation: number }
  | {
      type: "juncture:resolveStart";
      namespace: AnyNamespace;
      locale: AnyLocale | undefined;
      generation: number;
      vertexGenId: number | undefined;
    }
  | { type: "juncture:factoryInvoked"; namespace: AnyNamespace; locale: AnyLocale | undefined }
  | { type: "juncture:built"; namespace: AnyNamespace; kind: "kernel" | "outer" }
  | { type: "juncture:slotCommitted"; namespace: AnyNamespace; generation: number }
  | {
      type: "juncture:resolveStale";
      namespace: AnyNamespace;
      reason: "generation" | "slotIdentity";
      teardownInvoked: boolean;
    }
  | { type: "juncture:resolveError"; namespace: AnyNamespace; error: unknown }
  | { type: "juncture:slotDisposed"; namespace: AnyNamespace; teardownInvoked: boolean }
  | {
      type: "juncture:kitPartitioned";
      selfNamespace: AnyNamespace | undefined;
      eager: readonly AnyNamespace[];
      deferred: readonly AnyNamespace[];
    }
  | { type: "juncture:deferredKitAccessed"; namespace: AnyNamespace; ready: boolean }
  | { type: "juncture:vertexConsumerResolved"; namespace: AnyNamespace; consumerGenId: number }
  | { type: "juncture:vertexConsumerMissing"; namespace: AnyNamespace; genId: number }
  | { type: "juncture:vertexSlotRegistered"; namespace: AnyNamespace; genId: number }
  | { type: "juncture:invalidationStart"; rootNamespace: AnyNamespace; closure: readonly AnyNamespace[] }
  | { type: "juncture:subscribersNotified"; namespace: AnyNamespace; subscriberCount: number }
  | { type: "juncture:subscribed"; namespaces: readonly AnyNamespace[] }
  | { type: "juncture:unsubscribed"; namespaces: readonly AnyNamespace[] };

// ─── GateWire events ────────────────────────────────────────────────────

export type GateWireEvent =
  | { type: "gateWire:created"; genId: number; locale: AnyLocale; topLevelNs: readonly AnyNamespace[] }
  | { type: "gateWire:resolveTriggered"; genId: number }
  | { type: "gateWire:jmSubscribed"; genId: number }
  | { type: "gateWire:jmUnsubscribed"; genId: number; vertexSlotsDisposed: number }
  | { type: "gateWire:markedDirty"; genId: number; subscriberCount: number }
  | { type: "gateWire:updateRequested"; genId: number; localeChanged: boolean; vertexGearMapChanged: boolean }
  | { type: "gateWire:subscribed"; genId: number }
  | { type: "gateWire:unsubscribed"; genId: number }
  | { type: "gateWire:trackingStarted"; genId: number }
  | { type: "gateWire:trackingCommitted"; genId: number; depCount: number }
  | { type: "gateWire:cassetteNotified"; genId: number; subscriberCount: number };

// ─── Aggregato ──────────────────────────────────────────────────────────

export type InternalEvent = BlueprintEvent | JunctureEvent | GateWireEvent;

// ─── Bus interface + factory ────────────────────────────────────────────

// Emit is strictly synchronous: every subscriber returns before emit
// returns. Tests rely on this for ordering assertions ("X happened
// before Y"). Subscriber errors are caught — a broken collector must
// not break the runtime, especially on the hot path of resolve/dispose.
export interface InternalEventBus {
  emit(event: InternalEvent): void;
  subscribe(handler: (event: InternalEvent) => void): () => void;
}

export function createEventBus(): InternalEventBus {
  const handlers = new Set<(event: InternalEvent) => void>();
  return {
    emit(event) {
      for (const h of handlers) {
        try {
          h(event);
        } catch (e) {
          console.error(e);
        }
      }
    },
    subscribe(handler) {
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    },
  };
}

// ─── BusHost ────────────────────────────────────────────────────────────
// Minimal interface for objects that can hold a bus. Managers depend on
// this, not on RMachine — keeps them free of RMachine's type parameters.
// `bus` is `undefined` until something subscribes via BUS_ACCESSOR. Emit
// call-sites use `this.busHost.bus?.emit(...)` — zero-cost when no
// subscribers (optional chaining short-circuits argument evaluation).
// Field is `T | undefined` (not `?:`) so it remains type-compatible
// across implementations under `exactOptionalPropertyTypes: true`.

export interface BusHost {
  readonly bus: InternalEventBus | undefined;
}

// ─── Internal access symbol ─────────────────────────────────────────────
// Bridge between the public-facing Strategy/RMachine surfaces and the
// (lazy) bus. Public DevTools APIs use `target[BUS_ACCESSOR]()` to
// retrieve a guaranteed-non-null bus (created on first call). Not part
// of the package's typed public API surface.

export const BUS_ACCESSOR: unique symbol = Symbol("rMachine.bus.accessor");

// ─── BusBridge ──────────────────────────────────────────────────────────
// Structural interface for anything that exposes the bus accessor.
// RMachine and Strategy both implement this. Lives next to BUS_ACCESSOR
// by design: TypeScript ties `unique symbol` identity to the import path,
// so a downstream consumer that imports BusBridge from one path and
// BUS_ACCESSOR from another can end up with two distinct symbol identities
// — `target[BUS_ACCESSOR]` silently degrades to `any`. Co-locating
// guarantees both come through the same module.

export interface BusBridge {
  [BUS_ACCESSOR](): InternalEventBus;
}
