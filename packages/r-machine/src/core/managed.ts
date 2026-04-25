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

import type { AnyRes } from "./res.js";

const managedTeardownSymbol = Symbol("managedTeardown");
interface Managed {
  readonly [managedTeardownSymbol]: () => void;
}

export function tryGetManagedTeardown(res: AnyRes): (() => void) | undefined {
  return (res as Partial<Managed>)[managedTeardownSymbol];
}

export function managed<R extends AnyRes>(res: R, teardown: () => void): R {
  (res as any)[managedTeardownSymbol] = teardown;
  return res;
}
