/**
 * Copyright (c) 2026 Sergio Turolla and R-Machine contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BUS_ACCESSOR, type BusBridge } from "#r-machine/core";

/**
 * Subscribe a console-logging handler to the runtime event bus of the given
 * R-Machine instance (typically reached via a strategy). Intended for use
 * during development to trace internal coordination across BlueprintManager,
 * ResManager, and WireManager.
 *
 * Returns a function that removes the subscription. The bus itself is
 * created lazily on first call: in production code paths where this
 * function is never invoked, no bus is allocated and every internal emit
 * site short-circuits at the optional-chaining gate.
 */
export function enableRMachineDevMode(target: BusBridge): () => void {
  const bus = target[BUS_ACCESSOR]();
  return bus.subscribe((event) => {
    console.log(`[R-Machine] ${event.type}`, event);
  });
}
