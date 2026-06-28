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

import { ERR_NO_LOADER_REGISTERED, RMachineUsageError } from "#r-machine/errors";
import type { AnyLocale } from "#r-machine/locale";
import type { AnyNamespace, NamespaceParts } from "./res-domain.js";
import type { AnyResLayout } from "./res-layout.js";
import type { AnyResModule } from "./res-module.js";

export interface ResModuleLoaderFnOptions {
  readonly namespace: AnyNamespace;
  readonly namespaceParts: NamespaceParts;
  readonly pathParts: string[];
  readonly locale: AnyLocale | undefined;
}

export type ResModuleLoaderFn = (path: string, options: ResModuleLoaderFnOptions) => Promise<AnyResModule>;

// Prefixes a loader can be registered for: any of the layout's declared
// namespace prefixes, or "*" as a catch-all fallback.
type RegisterPrefixes<RL extends AnyResLayout> = ReadonlyArray<Extract<keyof RL, `${string}/`> | "*">;

/**
 * Mutable registry that assembles a single logical module loader from pieces
 * registered across one or more files. This is what lets a Next.js project keep
 * its server-only `import()` glob inside a `server-only`-fenced module: the
 * public file (`pub/loader.ts`) registers the client-safe prefixes, the
 * server-only file (`prv/loader.ts`) registers the server-only ones, and both
 * feed the same `load` dispatcher consumed by RMachine.
 */
export interface ResourceLoader<RL extends AnyResLayout> {
  /**
   * Register a loader for one or more layout prefixes — or `"*"` for a
   * catch-all fallback. The fn receives the full resource path (e.g.
   * "base/config", locale-suffixed for shells). May be called multiple times;
   * a prefix-specific loader always wins over `"*"`.
   */
  register(prefixes: RegisterPrefixes<RL>, fn: ResModuleLoaderFn): void;
  /** The dispatcher consumed by RMachine. Reads the registry lazily per call. */
  readonly load: ResModuleLoaderFn;
}

export type AnyResourceLoader = ResourceLoader<AnyResLayout>;

export function createResourceLoader<RL extends AnyResLayout = AnyResLayout>(): ResourceLoader<RL> {
  const map = new Map<string, ResModuleLoaderFn>();
  let catchAll: ResModuleLoaderFn | undefined;

  const load: ResModuleLoaderFn = (path, options) => {
    // `pathParts[0]` is the longest-matching layout prefix resolved upstream by
    // BlueprintManager. A prefix-specific loader wins; otherwise the `"*"` one.
    const prefix = options.pathParts[0];
    const fn = map.get(prefix) ?? catchAll;
    if (fn) {
      return fn(path, options);
    }
    throw new RMachineUsageError(
      ERR_NO_LOADER_REGISTERED,
      `No module loader registered for layout entry "${prefix}". Register one via ResourceAtlas.loader.register(["${prefix}"], ...) or a catch-all via ResourceAtlas.loader.register(["*"], ...).`
    );
  };

  return {
    register(prefixes, fn) {
      for (const prefix of prefixes) {
        if (prefix === "*") {
          catchAll = fn;
        } else {
          map.set(prefix, fn);
        }
      }
    },
    load,
  };
}
