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

import { insertCassette, type ReadableCell, recordRead } from "./cassette-recorder.js";

export interface MemoCell<V> extends ReadableCell {
  read(): V;
}

const UNSET: unique symbol = Symbol("memo-cell-unset");

export function createMemoCell<V>(body: () => V, equals: (a: V, b: V) => boolean = Object.is): MemoCell<V> {
  let value: V | typeof UNSET = UNSET;
  let dirty = true;
  let depUnsubs: Array<() => void> = [];
  const subscribers = new Set<() => void>();
  let recomputing = false;

  function recompute(): void {
    const handle = insertCassette();
    let next: V;
    try {
      next = body();
    } finally {
      handle.eject();
    }
    for (const unsub of depUnsubs) unsub();
    depUnsubs = [];
    for (const dep of handle.cassette.getDeps()) {
      depUnsubs.push(dep.subscribe(invalidate));
    }
    value = next;
    dirty = false;
  }

  function invalidate(): void {
    if (recomputing) return;
    if (subscribers.size === 0) {
      dirty = true;
      return;
    }
    const hadValue = value !== UNSET;
    const prevValue = value;
    dirty = true;
    try {
      recomputing = true;
      recompute();
    } finally {
      recomputing = false;
    }
    if (hadValue && !equals(prevValue as V, value as V)) {
      for (const cb of [...subscribers]) cb();
    }
  }

  const memo: MemoCell<V> = {
    read() {
      if (dirty) {
        try {
          recomputing = true;
          recompute();
        } finally {
          recomputing = false;
        }
      }
      recordRead(memo);
      return value as V;
    },
    subscribe(cb) {
      subscribers.add(cb);
      return () => {
        subscribers.delete(cb);
      };
    },
  };

  return memo;
}
