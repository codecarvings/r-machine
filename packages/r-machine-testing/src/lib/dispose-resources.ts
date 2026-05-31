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

import { type AnyPlugHead, getPlugMachine, type PlugBody } from "r-machine/core";

/**
 * Dispose all resolved resources for the RMachine that owns `plug`: tear down
 * every cached resource (running `Symbol.dispose` teardowns) and clear the
 * resolution caches, keeping loaded modules. Use it for **test isolation** —
 * typically `afterEach(() => disposeResources(r.plug))` — so a stateful OuterGear
 * resolved (as a dependency or kit) in one test cannot leak into the next.
 *
 * Reaches the machine via the back-reference stamped on `r.plug`; a no-op for a
 * plug built outside an RMachine. This is separate from `mockPlug(...).with(...)`'s
 * own reset, which only restores the overridden resolution.
 */
export function disposeResources(plug: PlugBody<AnyPlugHead>): void {
  getPlugMachine(plug)?.disposeResources();
}
