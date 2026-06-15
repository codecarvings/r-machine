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
import type { BusHost } from "./event-bus.js";
import type { AnyNamespace } from "./res-domain.js";

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
  /**
   * Re-runs `select`; if value changed, invokes `onChange(next, prev)`.
   * Returns the sync cmds produced by `onChange` (empty if none, void, or
   * async — async cmds are dispatched out-of-band by the runtime itself).
   * Also returns the relay's identifying name so the recorder can attribute
   * loop-detection events.
   */
  runIfDirty(): { cmds: readonly Cmd[]; relayName: string };
  dispose(): void;
}

/** Custom error thrown by the recorder when a relay's onChange fires more than the loop-detection threshold within one flush. */
export class RelayLoopError extends Error {
  constructor(
    readonly relayName: string,
    readonly runCount: number
  ) {
    super(
      `R-Machine relay "${relayName}" fired onChange ${runCount} times in a single flush — possible infinite loop.`
    );
    this.name = "RelayLoopError";
  }
}

const RELAY_LOOP_LIMIT = 3;

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
   * Used by GetterCell.recompute() so that a getter cell invalidating during an
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
  // (Wire, consumer code) are deferred while a transaction is active:
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

  // Cassettes are designed to be created once per long-lived owner (Wire,
  // GetterCell, …) and re-used across many recording passes. `insert()` clears
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
        if (!inserted) {
          return;
        }
        inserted = false;
        const idx = stack.indexOf(cassette);
        // `inserted === true` implies the cassette is in the stack (insert pushes
        // it; nothing else removes it), so idx is always >= 0 here.
        /* v8 ignore next */
        if (idx >= 0) {
          stack.splice(idx, 1);
        }
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
      // dispose() calls this at most once (it guards on a `disposed` flag), so
      // the relay is always still registered here — idx is never < 0.
      /* v8 ignore next */
      if (idx >= 0) {
        relays.splice(idx, 1);
      }
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
    // Per-flush counters for relay loop detection. A relay fires onChange
    // at most RELAY_LOOP_LIMIT times within one outermost-tx flush. Beyond
    // that, we abort with a `relay:loopDetected` bus event + RelayLoopError.
    const runCounts = new Map<RelayRuntime, number>();
    // Hold txDepth > 0 for the entire flush so any action dispatched by
    // Phase-2 cmd handling becomes a nested passthrough (txDepth 1→2→1)
    // instead of opening a fresh outermost tx (which would recursively
    // re-enter flush with its own runCounts — defeating loop detection
    // and risking unbounded recursion).
    txDepth++;
    let iterations = 0;
    try {
      while (dirtyRelays.size > 0 || dirtyCells.size > 0) {
        iterations++;
        // Defensive backstop: only reachable with >100 flush iterations where no
        // single relay hits the per-relay loop limit (3). The per-relay detection
        // catches realistic loops long before this fires.
        /* v8 ignore start */
        if (iterations > FLUSH_HARD_CAP) {
          console.error(
            `R-Machine: relay flush exceeded ${FLUSH_HARD_CAP} iterations — aborting to prevent infinite loop.`
          );
          dirtyRelays.clear();
          dirtyCells.clear();
          return;
        }
        /* v8 ignore stop */
        // ─── Phase 1: relays ──────────────────────────────────────────────
        // Each dirty relay fires onChange and returns the sync cmds it
        // produced. We COLLECT them here; we do NOT dispatch them inline.
        // Cmd application happens in Phase 2 — this ensures all relays in
        // the current snapshot see the same world state before cmd-driven
        // mutations start a new round of dirtying.
        const collectedCmds: Cmd[] = [];
        if (dirtyRelays.size > 0) {
          const snapshot = new Set(dirtyRelays);
          dirtyRelays.clear();
          const ordered = orderingProvider
            ? orderingProvider.order(snapshot, txSources, relays)
            : // Fallback: registration order, filtered to dirty.
              relays.filter((entry) => snapshot.has(entry.runtime)).map((entry) => entry.runtime);
          for (const r of ordered) {
            const result = r.runIfDirty();
            // Bump fire counter; abort if over the loop-detection threshold.
            const current = (runCounts.get(r) ?? 0) + 1;
            runCounts.set(r, current);
            if (current > RELAY_LOOP_LIMIT) {
              busHost?.bus?.emit({
                type: "relay:loopDetected",
                relayName: result.relayName,
                runCount: current,
              });
              // Clear pending state so the next flush starts clean even if
              // the throw is caught (or swallowed) somewhere upstream.
              dirtyRelays.clear();
              dirtyCells.clear();
              throw new RelayLoopError(result.relayName, current);
            }
            if (result.cmds.length > 0) {
              collectedCmds.push(...result.cmds);
            }
          }
        }
        // ─── Phase 2: cmd dispatch ────────────────────────────────────────
        // Each cmd is `cmd.action(...cmd.payload)`. Since `cmd.action` is
        // wrapped in makeAction → runInTransaction, the call opens a nested
        // tx (passthrough): the mutations feed into the SAME dirty queues
        // and the outer while-loop picks them up in a new iteration.
        for (const cmd of collectedCmds) {
          try {
            cmd.action(...cmd.payload);
          } catch (e) {
            // A cmd dispatched by a relay is a side-effect — same swallow +
            // bus event semantics as a direct onChange throw, attributed to
            // the action's name (best-effort).
            busHost?.bus?.emit({ type: "relay:onChangeError", relayName: "<cmd-dispatch>", error: e });
          }
        }
        // ─── Phase 3: external cell notifications, deduped per cell ──────
        if (dirtyCells.size > 0) {
          const snapshot = [...dirtyCells];
          dirtyCells.clear();
          for (const c of snapshot) {
            c.notifyExternal();
          }
        }
      }
    } finally {
      txDepth--;
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
