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
  const subscribers = new Set<() => void>();

  const cell: StateCell<S> = {
    read() {
      recorder.recordRead(cell);
      return current;
    },
    peek() {
      return current;
    },
    publish(next) {
      current = next;
      for (const cb of [...subscribers]) {
        cb();
      }
    },
    subscribe(cb) {
      subscribers.add(cb);
      return () => {
        subscribers.delete(cb);
      };
    },
  };

  return cell;
}
