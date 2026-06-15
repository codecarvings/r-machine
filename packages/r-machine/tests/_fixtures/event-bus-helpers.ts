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

// Test-only helpers for asserting on the internal event bus. Mirrors the
// public `createEventCollector` API from @r-machine/testing but lives
// in-package because r-machine cannot depend on @r-machine/testing (the
// dependency direction is reversed).
//
// Invariants this helper relies on:
//   1. Bus emit is strictly synchronous (see core/event-bus.ts comment on
//      InternalEventBus): every subscriber returns before emit() returns.
//      Tests that assert on event sequence after an awaited action see the
//      full buffer for that action.
//   2. Managers re-read `this.busHost.bus` on every emit (no cached
//      reference). So an eagerly-created bridge in tests is observationally
//      identical to RMachine's lazy bridge at runtime.
//   3. Subscriber-thrown errors are caught by the bus to keep the runtime
//      alive (see emit() in event-bus.ts). DO NOT put `expect()` calls
//      inside a subscribe callback — failures would be swallowed. Always
//      assert on `collector.events` AFTER the action under test completes.

import { expect } from "vitest";
import { BUS_ACCESSOR, createEventBus, type InternalEvent, type InternalEventBus } from "../../src/core/event-bus.js";

// Satisfies BOTH `BusHost` (the `bus` field that managers read on emit)
// AND `BusBridge` (the `[BUS_ACCESSOR]()` accessor that DevTools/test
// consumers call to retrieve the bus). The bus is created eagerly here —
// in RMachine the same bus is lazy. Both behaviors are observationally
// identical from the manager side (see invariant #2 above).
export interface TestBusBridge {
  bus: InternalEventBus;
  [BUS_ACCESSOR](): InternalEventBus;
}

export function makeTestBridge(): TestBusBridge {
  const bus = createEventBus();
  return { bus, [BUS_ACCESSOR]: () => bus };
}

export interface EventCollector {
  /** Events captured so far, in emit order. Read-only view. */
  readonly events: readonly InternalEvent[];
  /** Drop all captured events. Subscription remains active. */
  clear(): void;
  /** Unsubscribe from the bus. Idempotent. */
  dispose(): void;
}

export function collectEvents(bridge: TestBusBridge): EventCollector {
  const events: InternalEvent[] = [];
  const unsubscribe = bridge[BUS_ACCESSOR]().subscribe((event) => {
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

// A sequence matcher item is either:
//   - a type string (`"res:resolveStart"`) — matches any event of that type
//   - a partial event shape (`{ type: "res:resolveStale", reason: "generation" }`)
//     — matches an event of the given type with the given fields' values
export type EventMatcher = InternalEvent["type"] | Partial<InternalEvent>;

function matches(event: InternalEvent, matcher: EventMatcher): boolean {
  if (typeof matcher === "string") {
    return event.type === matcher;
  }
  for (const [key, expected] of Object.entries(matcher)) {
    if ((event as unknown as Record<string, unknown>)[key] !== expected) {
      return false;
    }
  }
  return true;
}

function describeMatcher(matcher: EventMatcher): string {
  return typeof matcher === "string" ? matcher : JSON.stringify(matcher);
}

/**
 * Non-strict (sparse) sequence match: asserts that each matcher in `expected`
 * is found in `events` in the given relative order. Unmatched events between
 * matches are allowed. Use this as the default — it stays robust when new
 * emit points are added in unrelated paths.
 *
 * For exact full-buffer equality, use `expectEventSequenceStrict` instead.
 */
export function expectEventSequence(events: readonly InternalEvent[], expected: readonly EventMatcher[]): void {
  let cursor = 0;
  for (const matcher of expected) {
    let found = -1;
    for (let i = cursor; i < events.length; i++) {
      if (matches(events[i] as InternalEvent, matcher)) {
        found = i;
        break;
      }
    }
    if (found === -1) {
      const eventTypes = events.map((e) => e.type);
      expect.fail(
        `Expected event matching ${describeMatcher(matcher)} after index ${cursor}, but did not find it. ` +
          `Buffer types: [${eventTypes.join(", ")}]`
      );
    }
    cursor = found + 1;
  }
}

/**
 * Strict full-buffer match: every event in `events` must match its
 * positional matcher and the lengths must be equal. Use sparingly — strict
 * matches are fragile against unrelated emit additions.
 */
export function expectEventSequenceStrict(events: readonly InternalEvent[], expected: readonly EventMatcher[]): void {
  expect(events).toHaveLength(expected.length);
  for (let i = 0; i < expected.length; i++) {
    const event = events[i] as InternalEvent;
    const matcher = expected[i] as EventMatcher;
    if (!matches(event, matcher)) {
      expect.fail(`At index ${i}: expected ${describeMatcher(matcher)}, got ${JSON.stringify(event)}`);
    }
  }
}

/**
 * Asserts that an event matching `before` appears in `events` strictly
 * before an event matching `later`. Fails if either matcher misses.
 * Useful for asserting ordering invariants without committing to a full
 * sequence.
 */
export function expectEventBefore(events: readonly InternalEvent[], before: EventMatcher, later: EventMatcher): void {
  const beforeIdx = events.findIndex((e) => matches(e, before));
  const laterIdx = events.findIndex((e) => matches(e, later));
  if (beforeIdx === -1) {
    expect.fail(`Expected event ${describeMatcher(before)} not found in buffer.`);
  }
  if (laterIdx === -1) {
    expect.fail(`Expected event ${describeMatcher(later)} not found in buffer.`);
  }
  if (beforeIdx >= laterIdx) {
    expect.fail(
      `Expected ${describeMatcher(before)} (index ${beforeIdx}) to come before ${describeMatcher(later)} (index ${laterIdx}).`
    );
  }
}
