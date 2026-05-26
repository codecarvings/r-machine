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

import { type Action, createAction } from "../action.js";
import { deepPartialMerge } from "../deep-partial.js";
import type { AnyNamespace } from "../res-domain.js";
import type { CassetteRecorder } from "./cassette-recorder.js";
import type { StateCell } from "./state-cell.js";

export function makeAction<S, A extends unknown[]>(
  cell: StateCell<S>,
  reducer: (...args: A) => unknown,
  recorder: CassetteRecorder,
  name: string,
  namespace?: AnyNamespace
): Action<(...args: A) => S> {
  return createAction(
    (...args: A): S =>
      // The outermost action opens the transaction; nested action calls
      // (re-entrant) take the passthrough path inside runInTransaction
      // and contribute to the same dirty queues. The outermost frame
      // flushes once — external subscribers receive at most one
      // notification per affected cell regardless of nesting depth.
      // `namespace`, when known, is accumulated into the tx's source set
      // and used by the relay ordering provider to compute depth(relay).
      recorder.runInTransaction(() => {
        const raw = recorder.withSilentZone(() => reducer(...args));
        const prev = cell.peek();
        if (raw === prev) {
          return prev;
        }
        const merged = deepPartialMerge(prev, raw);
        if (merged === prev) {
          return prev;
        }
        cell.publish(merged);
        return merged;
      }, namespace),
    name
  );
}
