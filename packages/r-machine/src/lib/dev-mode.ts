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

import { BUS_ACCESSOR, type BusBridge } from "#r-machine/core";

/**
 * Subscribe a console-logging handler to the runtime event bus of the given
 * R-Machine instance (typically reached via a strategy). Intended for use
 * during development to trace internal coordination across BlueprintManager,
 * JunctureManager, and GateWireManager.
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
