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

/**
 * Dispose a resource by invoking its `[Symbol.dispose]()` method.
 *
 * Convenience for callers who cannot (or prefer not to) use `using` /
 * `await using` syntax and would otherwise reach for the symbol directly
 * (`resource[Symbol.dispose]()`).
 */
export function dispose(disposable: Disposable): void {
  disposable[Symbol.dispose]();
}
