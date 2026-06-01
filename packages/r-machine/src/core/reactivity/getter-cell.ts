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

export interface GetterCell<V> extends ReadableCell {
  read(): V;
}

const UNSET: unique symbol = Symbol("getter-cell-unset");

export function createGetterCell<V>(
  body: () => V,
  recorder: CassetteRecorder,
  equals: (a: V, b: V) => boolean = Object.is
): GetterCell<V> {
  let value: V | typeof UNSET = UNSET;
  let dirty = true;
  let depUnsubs: Array<() => void> = [];
  // Two tiers, mirroring StateCell: internal subscribers (relay markDirty,
  // other getter cells invalidating) fire inline; external subscribers (GateWire,
  // consumer) are deferred through the recorder's dirty-cell queue when a
  // transaction is active, otherwise inline (legacy path).
  const internalSubs = new Set<() => void>();
  const externalSubs = new Set<() => void>();
  let recomputing = false;
  let hasExternalDirtyTrigger = false; // active flag while memo is enqueued for external flush
  // Persistent private cassette for capturing the body's reads on each
  // recompute. `insert()` clears prior deps; `eject()` is idempotent.
  const cassette = recorder.createCassette();

  function notifyExternal(): void {
    hasExternalDirtyTrigger = false;
    for (const cb of [...externalSubs]) cb();
  }

  function recompute(): void {
    cassette.insert();
    let next: V;
    try {
      // runOutsideSilent: when this recompute is triggered by an action
      // (whose reducer runs in a silent zone), reads inside body() must
      // still be tracked into this memo's private cassette so deps are
      // re-subscribed correctly. Top-of-stack scoping in the recorder
      // keeps these reads scoped to THIS cassette only — no leak.
      next = recorder.runOutsideSilent(body);
    } finally {
      cassette.eject();
    }
    for (const unsub of depUnsubs) unsub();
    depUnsubs = [];
    // Deps subscribe via the INTERNAL tier so invalidate fires inside the
    // tick — never deferred. This keeps the reactivity cascade consistent.
    for (const dep of cassette.getDeps()) {
      depUnsubs.push(dep.subscribeInternal(invalidate));
    }
    value = next;
    dirty = false;
  }

  function invalidate(): void {
    if (recomputing) {
      return;
    }
    // Lazy when nothing depends on us (no subs, internal or external).
    if (internalSubs.size === 0 && externalSubs.size === 0) {
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
    if (!hadValue || equals(prevValue as V, value as V)) {
      return;
    }
    // Output changed: notify internal subs inline (relays in the same tick);
    // schedule external subs for deferred flush if a tx is active, else inline.
    for (const cb of [...internalSubs]) cb();
    if (externalSubs.size === 0) return;
    if (recorder.isInTransaction()) {
      if (!hasExternalDirtyTrigger) {
        hasExternalDirtyTrigger = true;
        recorder.enqueueDirtyCell({ notifyExternal });
      }
    } else {
      notifyExternal();
    }
  }

  const cell: GetterCell<V> = {
    read() {
      if (dirty) {
        try {
          recomputing = true;
          recompute();
        } finally {
          recomputing = false;
        }
      }
      recorder.recordRead(cell);
      return value as V;
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
