/**
 * Copyright (c) 2026 Sergio Turolla and R-Machine contributors
 * SPDX-License-Identifier: Apache-2.0
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
