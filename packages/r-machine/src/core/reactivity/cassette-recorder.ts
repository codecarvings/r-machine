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
  readonly id: number;
  readonly silent: boolean;
  record(cell: ReadableCell): void;
  getDeps(): ReadonlySet<ReadableCell>;
}

let nextCassetteId = 0;

const active = new Set<Cassette>();
let silentDepth = 0;

export function recordRead(cell: ReadableCell): void {
  if (silentDepth > 0) return;
  for (const cassette of active) {
    cassette.record(cell);
  }
}

export interface InsertCassetteResult {
  readonly cassette: Cassette;
  eject(): void;
}

export function insertCassette(options?: { silent?: boolean }): InsertCassetteResult {
  const silent = options?.silent === true;
  const deps = new Set<ReadableCell>();
  const cassette: Cassette = {
    id: ++nextCassetteId,
    silent,
    record(cell) {
      deps.add(cell);
    },
    getDeps() {
      return deps;
    },
  };
  active.add(cassette);
  if (silent) silentDepth++;
  let ejected = false;
  return {
    cassette,
    eject() {
      if (ejected) return;
      ejected = true;
      active.delete(cassette);
      if (silent) silentDepth--;
    },
  };
}

export function withSilentZone<T>(fn: () => T): T {
  const handle = insertCassette({ silent: true });
  try {
    return fn();
  } finally {
    handle.eject();
  }
}
