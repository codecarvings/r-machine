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

import { BUS_ACCESSOR, type BusBridge, type InternalEvent } from "r-machine/core";

export interface EventCollector {
  /**
   * Events collected so far, in emit order. Treat as read-only — mutating
   * this array will not affect future collection but will surprise other
   * readers. Use `clear()` to reset.
   */
  readonly events: readonly InternalEvent[];
  /**
   * Drop all collected events. Useful between phases of a test when you
   * want to assert on a fresh window without re-creating the collector.
   */
  clear(): void;
  /**
   * Unsubscribe from the bus. After dispose, `events` no longer grows.
   * Safe to call multiple times.
   */
  dispose(): void;
}

/**
 * Subscribe a buffer to the runtime event bus of the given R-Machine
 * instance (reached via a strategy or RMachine itself). The returned
 * collector accumulates every emitted internal event in insertion order
 * until disposed.
 *
 * Designed for test isolation: each call creates a private buffer with
 * its own subscription, so parallel tests don't share state as long as
 * each test uses its own strategy/machine instance.
 */
export function createEventCollector(target: BusBridge): EventCollector {
  const events: InternalEvent[] = [];
  const unsubscribe = target[BUS_ACCESSOR]().subscribe((event) => {
    events.push(event);
  });
  let disposed = false;
  return {
    get events() {
      return events;
    },
    clear() {
      events.length = 0;
    },
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      unsubscribe();
    },
  };
}
