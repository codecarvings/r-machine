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
import { type AnyPlugHead, plugHeadSymbol } from "./plug.js";
import type { AnyResOrigin, ResFamily } from "./res.js";
import type { AnyNamespace } from "./res-atlas.js";
import type { ResLayoutEntryType } from "./res-layout.js";
import { type AnyResMatrix, tryGetResMatrixMeta } from "./res-matrix.js";
import type { AnyResModule } from "./res-module.js";

type ResOriginType = "resource" | "res-matrix";

export interface ResPod {
  readonly namespace: AnyNamespace;
  readonly locale: AnyLocale | undefined;
  readonly family: ResFamily;
  readonly isReactive: boolean;
  readonly isVertex: boolean;
  readonly plugHead: AnyPlugHead | undefined;
  readonly originType: ResOriginType;
  readonly origin: AnyResOrigin;
}

export function createResPod(
  module: AnyResModule,
  namespace: AnyNamespace,
  locale: AnyLocale | undefined,
  resLayoutEntryType: ResLayoutEntryType
): ResPod {
  const origin = module.r;
  const matrixMeta = tryGetResMatrixMeta(origin);

  if (matrixMeta !== undefined) {
    const { family, isReactive, isVertex } = matrixMeta;
    const layoutFamily: ResFamily = resLayoutEntryType === "dynamic-shell" ? "shell" : resLayoutEntryType;
    if (family !== layoutFamily) {
      throw new RMachineResolveError(
        ERR_RESOLVE_FAILED,
        `Unable to build resource pod for namespace "${namespace}" - matrix family "${family}" does not match layout type "${resLayoutEntryType}".`
      );
    }
    const plugHead = (origin as AnyResMatrix).plug[plugHeadSymbol];
    return {
      namespace,
      locale,
      family,
      isReactive,
      isVertex,
      plugHead,
      originType: "res-matrix",
      origin,
    };
  }

  if (resLayoutEntryType === "dynamic-shell") {
    throw new RMachineResolveError(
      ERR_RESOLVE_FAILED,
      `Unable to build resource pod for namespace "${namespace}" - layout "dynamic-shell" requires a shell factory, got a raw resource.`
    );
  }

  return {
    namespace,
    locale,
    family: resLayoutEntryType,
    isReactive: false,
    isVertex: false,
    plugHead: undefined,
    originType: "resource",
    origin,
  };
}
