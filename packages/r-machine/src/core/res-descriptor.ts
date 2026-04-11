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
import type { AnyModule } from "./module.js";
import type { AnyResOrigin, ResFamily } from "./res.js";
import type { AnyNamespace } from "./res-atlas.js";
import type { ResLayoutType } from "./res-layout.js";
import { type AnyResMatrix, tryGetResMatrixDescriptor } from "./res-matrix.js";
import { getResPlugDescriptor } from "./res-plug.js";

type ResOriginType = "resource" | "res-matrix";

export interface ResDescriptor {
  readonly namespace: AnyNamespace;
  readonly locale: AnyLocale | undefined;
  readonly family: ResFamily;
  readonly isReactive: boolean;
  readonly isVertex: boolean;
  readonly deps: AnyNamespace[];
  readonly originType: ResOriginType;
  readonly origin: AnyResOrigin;
}

export function createResDescriptor(
  module: AnyModule,
  namespace: AnyNamespace,
  locale: AnyLocale | undefined,
  resLayoutType: ResLayoutType
): ResDescriptor {
  const origin = module.r;
  const matrixDescriptor = tryGetResMatrixDescriptor(origin);

  if (matrixDescriptor !== undefined) {
    const { family, isReactive, isVertex } = matrixDescriptor;
    const layoutFamily: ResFamily = resLayoutType === "dynamic-shell" ? "shell" : resLayoutType;
    if (family !== layoutFamily) {
      throw new RMachineResolveError(
        ERR_RESOLVE_FAILED,
        `Unable to build descriptor for namespace "${namespace}" - matrix family "${family}" does not match layout "${resLayoutType}".`
      );
    }
    const { deps } = getResPlugDescriptor((origin as AnyResMatrix).plug);
    return {
      namespace,
      locale,
      family,
      isReactive,
      isVertex,
      deps,
      originType: "res-matrix",
      origin,
    };
  }

  if (resLayoutType === "dynamic-shell") {
    throw new RMachineResolveError(
      ERR_RESOLVE_FAILED,
      `Unable to build descriptor for namespace "${namespace}" - layout "dynamic-shell" requires a shell factory, got a raw resource.`
    );
  }

  return {
    namespace,
    locale,
    family: resLayoutType,
    isReactive: false,
    isVertex: false,
    deps: [],
    originType: "resource",
    origin,
  };
}
