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

import type { BusHost } from "../event-bus.js";
import type { AnyNamespace } from "../res-domain.js";

export interface ReadableCell {
  subscribe(cb: () => void): () => void;
  subscribeInternal(cb: () => void): () => void;
}

export interface Cassette {
  insert(): void;
  eject(): void;
  record(cell: ReadableCell): void;
  getDeps(): ReadonlySet<ReadableCell>;
}

/** Minimal contract for cells that batch their external notifications under a transaction. */
export interface DirtyCell {
  notifyExternal(): void;
}

/** Minimal contract for the relay runtime, as seen by the recorder. */
export interface RelayRuntime {
  runIfDirty(): void;
  dispose(): void;
}

/** A registered relay together with its hosting OG namespace (for ordering). */
export interface RegisteredRelay {
  readonly runtime: RelayRuntime;
  readonly namespace: AnyNamespace | undefined;
}

/**
 * Pluggable ordering for relays at flush time. Step 1 uses the recorder's
 * built-in FIFO order; Step 2 boot-installs a blueprint-backed provider
 * that sorts by (dep-depth from any source, atlas priority, registration
 * index).
 */
export interface RelayOrderingProvider {
  order(
    dirtyRelays: ReadonlySet<RelayRuntime>,
    sources: ReadonlySet<AnyNamespace>,
    fullList: readonly RegisteredRelay[]
  ): RelayRuntime[];
}

export interface CassetteRecorder {
  createCassette(): Cassette;
  recordRead(cell: ReadableCell): void;
  pushSilent(): void;
  popSilent(): void;
  withSilentZone<T>(fn: () => T): T;
  /**
   * Temporarily resets silent depth to 0 so reads inside `fn` are tracked.
   * Used by MemoCell.recompute() so that a memo invalidating during an
   * action (which wraps its reducer in withSilentZone) can still capture
   * its own deps via its private cassette. Top-of-stack scoping protects
   * outer cassettes from leakage.
   */
  runOutsideSilent<T>(fn: () => T): T;
  // ─── Transaction API (used by makeAction + cell.publish) ─────────────
  /**
   * Opens a transaction frame. The outermost frame flushes on exit.
   * `sourceNamespace` (when known — the namespace of the OG whose action
   * triggered this frame) is accumulated into the current tx's source set;
   * the flush ordering uses this set to compute depth(relay).
   */
  runInTransaction<T>(fn: () => T, sourceNamespace?: AnyNamespace): T;
  isInTransaction(): boolean;
  enqueueDirtyCell(cell: DirtyCell): void;
  // ─── Relay registry ──────────────────────────────────────────────────
  /** Registers a relay; `namespace` (when known) is the OG hosting the relay. */
  registerRelay(r: RelayRuntime, namespace?: AnyNamespace): () => void;
  markRelayDirty(r: RelayRuntime): void;
  emitRelayError(relayName: string, error: unknown): void;
  // ─── Ordering provider (Step 2) ──────────────────────────────────────
  setRelayOrderingProvider(provider: RelayOrderingProvider | undefined): void;
}

const FLUSH_HARD_CAP = 100;

// Per-instance recorder: each RMachine instance owns one. The active stack
// and silentDepth live in this closure — never shared across machines. Two
// R-Machines in the same process (SSR multi-tenant, micro-frontend) won't
// cross-contaminate cassettes or silent zones.
export function createCassetteRecorder(busHost?: BusHost): CassetteRecorder {
  // Stack of currently-inserted cassettes. Reads land in the topmost only,
  // which scopes tracking to the most-recently-entered context. This is
  // exactly the semantic React's nested render needs: a parent component's
  // cassette opens first, then child renders push their own cassettes on
  // top, so a child's reads do NOT pollute its parent's tracked deps. Memo
  // recomputes work the same way — the memo's private cassette pushes on
  // top of the consumer's cassette, captures only its body's reads, then
  // pops and the consumer records the memo itself as a single dep.
  const stack: Cassette[] = [];
  let silentDepth = 0;

  // ─── Transaction state ───────────────────────────────────────────────
  // Two-tier subscriber model: internal subscribers (memo invalidate,
  // relay markDirty) fire inline inside publish(). External subscribers
  // (GateWire, consumer code) are deferred while a transaction is active:
  // the cell enqueues itself here and the outermost runInTransaction
  // flushes the set ONCE per cell. Outside any transaction, publish()
  // notifies externals inline (legacy backwards-compatible path).
  let txDepth = 0;
  const dirtyCells = new Set<DirtyCell>();
  const dirtyRelays = new Set<RelayRuntime>();
  // Registration-ordered list so flush is deterministic (FIFO when no
  // ordering provider is installed). Step 2 installs a blueprint-backed
  // provider that sorts dirty relays by (depth, priority, registration).
  const relays: RegisteredRelay[] = [];
  // Source namespaces accumulated across all action frames within the
  // outermost transaction. Cleared after each flush. Used by the ordering
  // provider to compute depth(relay) = min distance from any source to
  // the relay's hosting OG namespace.
  const txSources = new Set<AnyNamespace>();
  let orderingProvider: RelayOrderingProvider | undefined;

  function recordRead(cell: ReadableCell): void {
    if (silentDepth > 0) {
      return;
    }
    const top = stack[stack.length - 1];
    if (top !== undefined) {
      top.record(cell);
    }
  }

  // Cassettes are designed to be created once per long-lived owner (GateWire,
  // MemoCell, …) and re-used across many recording passes. `insert()` clears
  // the previously-collected deps before re-activating — calling insert on an
  // already-inserted cassette is idempotent and resets the recording state.
  // `eject()` is also idempotent. The deps remain readable via `getDeps()`
  // between eject and the next insert, so commit-time consumers can walk them.
  function createCassette(): Cassette {
    const deps = new Set<ReadableCell>();
    let inserted = false;
    const cassette: Cassette = {
      record(cell) {
        deps.add(cell);
      },
      getDeps() {
        return deps;
      },
      insert() {
        deps.clear();
        if (inserted) {
          // Already in the stack from a previous render. Bubble to top so
          // reads during THIS render land here, not in some sibling cassette
          // that was pushed in between (e.g., under React Suspense retry that
          // re-renders the whole boundary subtree, or under any pattern that
          // re-enters a component whose persistent cassette is mid-stack).
          const idx = stack.indexOf(cassette);
          if (idx >= 0 && idx !== stack.length - 1) {
            stack.splice(idx, 1);
            stack.push(cassette);
          }
        } else {
          inserted = true;
          stack.push(cassette);
        }
      },
      eject() {
        if (!inserted) return;
        inserted = false;
        const idx = stack.indexOf(cassette);
        if (idx >= 0) stack.splice(idx, 1);
      },
    };
    return cassette;
  }

  // Silent zones are a pure counter mechanism — they have no deps to record,
  // so they don't participate in the Cassette lifecycle. While the counter
  // is positive, `recordRead` skips every active cassette.
  function pushSilent(): void {
    silentDepth++;
  }

  function popSilent(): void {
    silentDepth--;
  }

  function withSilentZone<T>(fn: () => T): T {
    pushSilent();
    try {
      return fn();
    } finally {
      popSilent();
    }
  }

  function runOutsideSilent<T>(fn: () => T): T {
    const saved = silentDepth;
    silentDepth = 0;
    try {
      return fn();
    } finally {
      silentDepth = saved;
    }
  }

  function runInTransaction<T>(fn: () => T, sourceNamespace?: AnyNamespace): T {
    txDepth++;
    if (sourceNamespace !== undefined) {
      txSources.add(sourceNamespace);
    }
    try {
      return fn();
    } finally {
      txDepth--;
      if (txDepth === 0) {
        flush();
        txSources.clear();
      }
    }
  }

  function isInTransaction(): boolean {
    return txDepth > 0;
  }

  function enqueueDirtyCell(cell: DirtyCell): void {
    dirtyCells.add(cell);
  }

  function registerRelay(r: RelayRuntime, namespace?: AnyNamespace): () => void {
    relays.push({ runtime: r, namespace });
    return () => {
      const idx = relays.findIndex((entry) => entry.runtime === r);
      if (idx >= 0) relays.splice(idx, 1);
      dirtyRelays.delete(r);
    };
  }

  function markRelayDirty(r: RelayRuntime): void {
    dirtyRelays.add(r);
  }

  function emitRelayError(relayName: string, error: unknown): void {
    busHost?.bus?.emit({ type: "relay:onChangeError", relayName, error });
  }

  function setRelayOrderingProvider(provider: RelayOrderingProvider | undefined): void {
    orderingProvider = provider;
  }

  function flush(): void {
    let iterations = 0;
    while (dirtyRelays.size > 0 || dirtyCells.size > 0) {
      iterations++;
      if (iterations > FLUSH_HARD_CAP) {
        console.error(
          `R-Machine: relay flush exceeded ${FLUSH_HARD_CAP} iterations — aborting to prevent infinite loop.`
        );
        dirtyRelays.clear();
        dirtyCells.clear();
        return;
      }
      // Relays first: their onChange may indirectly mutate cells (Step 3
      // will dispatch returned cmds; for now any inline action call inside
      // onChange feeds back into the same dirty queues via the nested-tx
      // passthrough path).
      if (dirtyRelays.size > 0) {
        const snapshot = new Set(dirtyRelays);
        dirtyRelays.clear();
        const ordered = orderingProvider
          ? orderingProvider.order(snapshot, txSources, relays)
          : // Fallback: registration order, filtered to dirty.
            relays.filter((entry) => snapshot.has(entry.runtime)).map((entry) => entry.runtime);
        for (const r of ordered) {
          r.runIfDirty();
        }
      }
      // Then external cell notifications, deduplicated per cell.
      if (dirtyCells.size > 0) {
        const snapshot = [...dirtyCells];
        dirtyCells.clear();
        for (const c of snapshot) c.notifyExternal();
      }
    }
  }

  return {
    createCassette,
    recordRead,
    pushSilent,
    popSilent,
    withSilentZone,
    runOutsideSilent,
    runInTransaction,
    isInTransaction,
    enqueueDirtyCell,
    registerRelay,
    markRelayDirty,
    emitRelayError,
    setRelayOrderingProvider,
  };
}
