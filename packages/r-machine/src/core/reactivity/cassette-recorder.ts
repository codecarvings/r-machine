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

export interface ReadableCell {
  subscribe(cb: () => void): () => void;
}

export interface Cassette {
  insert(): void;
  eject(): void;
  record(cell: ReadableCell): void;
  getDeps(): ReadonlySet<ReadableCell>;
}

export interface CassetteRecorder {
  createCassette(): Cassette;
  recordRead(cell: ReadableCell): void;
  pushSilent(): void;
  popSilent(): void;
  withSilentZone<T>(fn: () => T): T;
}

// Per-instance recorder: each RMachine instance owns one. The active stack
// and silentDepth live in this closure — never shared across machines. Two
// R-Machines in the same process (SSR multi-tenant, micro-frontend) won't
// cross-contaminate cassettes or silent zones.
export function createCassetteRecorder(): CassetteRecorder {
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

  return { createCassette, recordRead, pushSilent, popSilent, withSilentZone };
}
