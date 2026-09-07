/**
 * Copyright (c) 2026 Sergio Turolla
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CassetteRecorder, ReadableCell } from "./cassette-recorder.js";
import { deepFreeze } from "./deep-freeze.js";
import { isDevEnv } from "./dev-env.js";

export interface StateCell<S> extends ReadableCell {
  read(): S;
  peek(): S;
  publish(next: S): void;
}

// Dev-only: deep-freeze every value that becomes the cell's `current`, so a
// consumer that mutates read state in place (`state.x = 1`) — instead of going
// through an action — fails loudly with a TypeError rather than silently not
// re-rendering. Resolved once; in production this is `false` and the
// `deepFreeze` calls are dead-code-eliminated by bundlers.
const FREEZE_STATE = isDevEnv();
const guard = <S>(value: S): S => (FREEZE_STATE ? deepFreeze(value) : value);

export function createStateCell<S>(initial: S, recorder: CassetteRecorder): StateCell<S> {
  let current = guard(initial);
  // Two tiers: internal subscribers (memo invalidate, relay markDirty)
  // always fire inline; external subscribers (Wire, consumer code)
  // are deferred via the recorder's dirty-cell queue when a transaction
  // is active, then flushed once at the end of the outermost transaction
  // (deduplicated per cell). Outside any transaction, externals fire
  // inline (legacy backwards-compatible path).
  const internalSubs = new Set<() => void>();
  const externalSubs = new Set<() => void>();

  function notifyExternal(): void {
    for (const cb of [...externalSubs]) {
      cb();
    }
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
      if (Object.is(next, current)) {
        return;
      }
      current = guard(next);
      for (const cb of [...internalSubs]) {
        cb();
      }
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
