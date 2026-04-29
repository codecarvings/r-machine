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

import { ERR_RESOLVE_FAILED, RMachineResolveError } from "#r-machine/errors";
import type { AnyLocale } from "#r-machine/locale";
import type { AnyResOrigin } from "./res.js";
import type { AnyNamespace, NamespaceParts } from "./res-domain.js";

export interface AnyResModule {
  readonly r: AnyResOrigin;
}

export interface ResModuleLoaderFnOptions {
  readonly namespace: AnyNamespace;
  readonly namespaceParts: NamespaceParts;
  readonly pathParts: string[];
  readonly locale: AnyLocale | undefined;
  readonly onUpdate: () => void;
}

export type ResModuleLoaderFn = (path: string, options?: ResModuleLoaderFnOptions) => Promise<AnyResModule>;

export function validateResModule(input: unknown): RMachineResolveError | null {
  if (typeof input !== "object" || input === null) {
    return new RMachineResolveError(
      ERR_RESOLVE_FAILED,
      `Invalid resource module - expected an object, got ${input === null ? "null" : typeof input}.`
    );
  }
  if (!("r" in input)) {
    return new RMachineResolveError(ERR_RESOLVE_FAILED, `Invalid resource module - missing required property "r".`);
  }
  const r = (input as { r: unknown }).r;
  if (typeof r !== "object" || r === null) {
    return new RMachineResolveError(
      ERR_RESOLVE_FAILED,
      `Invalid resource module - property "r" is not a valid resource origin (expected a non-null object, got ${r === null ? "null" : typeof r}).`
    );
  }
  return null;
}
