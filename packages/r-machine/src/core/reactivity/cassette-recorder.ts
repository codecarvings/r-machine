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

// Per-instance recorder: each RMachine instance owns one. The active Set
// and silentDepth live in this closure — never shared
// across machines. Two R-Machines in the same process (SSR multi-tenant,
// micro-frontend) won't cross-contaminate cassettes or silent zones.
export function createCassetteRecorder(): CassetteRecorder {
  const active = new Set<Cassette>();
  let silentDepth = 0;

  function recordRead(cell: ReadableCell): void {
    if (silentDepth > 0) {
      return;
    }
    for (const cassette of active) {
      cassette.record(cell);
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
        if (!inserted) {
          inserted = true;
          active.add(cassette);
        }
      },
      eject() {
        if (!inserted) return;
        inserted = false;
        active.delete(cassette);
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
