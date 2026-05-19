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

import type { CassetteRecorder, ReadableCell } from "./cassette-recorder.js";

export interface StateCell<S> extends ReadableCell {
  read(): S;
  peek(): S;
  publish(next: S): void;
}

export function createStateCell<S>(initial: S, recorder: CassetteRecorder): StateCell<S> {
  let current = initial;
  // Two tiers: internal subscribers (memo invalidate, relay markDirty)
  // always fire inline; external subscribers (GateWire, consumer code)
  // are deferred via the recorder's dirty-cell queue when a transaction
  // is active, then flushed once at the end of the outermost transaction
  // (deduplicated per cell). Outside any transaction, externals fire
  // inline (legacy backwards-compatible path).
  const internalSubs = new Set<() => void>();
  const externalSubs = new Set<() => void>();

  function notifyExternal(): void {
    for (const cb of [...externalSubs]) cb();
  }

  const cell: StateCell<S> = {
    read() {
      recorder.recordRead(cell);
      return current;
    },
    peek() {
      return current;
    },
    publish(next) {
      if (Object.is(next, current)) return;
      current = next;
      for (const cb of [...internalSubs]) cb();
      if (recorder.isInTransaction()) {
        recorder.enqueueDirtyCell({ notifyExternal });
      } else {
        notifyExternal();
      }
    },
    subscribe(cb) {
      externalSubs.add(cb);
      return () => {
        externalSubs.delete(cb);
      };
    },
    subscribeInternal(cb) {
      internalSubs.add(cb);
      return () => {
        internalSubs.delete(cb);
      };
    },
  };

  return cell;
}
