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

import type { AnyLocale } from "#r-machine/locale";
import type { AnyNamespace } from "./res-domain.js";

/**
 * Attribution attached to an error thrown during resource resolution: which
 * namespace actually failed, in which locale, and the resolution chain that
 * led there. Read it with {@link getResolveContext}.
 */
export interface ResolveContext {
  readonly namespace: AnyNamespace;
  readonly locale: AnyLocale | undefined;
  /** Resolution path, root-first, ending with the failing `namespace`. */
  readonly chain: readonly AnyNamespace[];
}

// Module-local: consumers never touch the symbol — they use the helpers below.
const RESOLVE_CONTEXT: unique symbol = Symbol("rMachineResolveContext");

/**
 * Attach resolution attribution to a thrown error **without changing its
 * identity**. The error keeps propagating verbatim — same object, same
 * prototype — so framework control-flow signals (Next.js `notFound()` /
 * `redirect()` sentinels) and domain `instanceof` checks are unaffected. The
 * context is stored on a non-enumerable symbol key, so it never shows up in
 * logging or `JSON.stringify`.
 *
 * Attach-if-absent: only the **deepest** resolve attributes (the first catch
 * to see the error, i.e. the namespace that actually failed). No-op when:
 * - `error` is not an object (a `throw "str"` / `throw 42`);
 * - the error already carries a context (a parent resolve won't overwrite it);
 * - the error is frozen/sealed (best-effort — the throw is swallowed).
 */
export function attachResolveContext(error: unknown, ctx: ResolveContext): void {
  if (typeof error !== "object" || error === null) {
    return;
  }
  if (RESOLVE_CONTEXT in error) {
    return;
  }
  try {
    Object.defineProperty(error, RESOLVE_CONTEXT, {
      value: ctx,
      enumerable: false,
      configurable: true,
      writable: false,
    });
  } catch {
    // Frozen/sealed error — cannot annotate. Attribution is best-effort.
  }
}

/**
 * Read the resolution attribution attached by R-Machine to an error thrown
 * during resource resolution, or `undefined` if there is none (e.g. the error
 * did not originate from a factory/resolution, or was a non-object throw).
 * Useful inside a React Error Boundary or a server `try/catch` to learn which
 * namespace failed.
 */
export function getResolveContext(error: unknown): ResolveContext | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }
  return (error as { [RESOLVE_CONTEXT]?: ResolveContext })[RESOLVE_CONTEXT];
}
