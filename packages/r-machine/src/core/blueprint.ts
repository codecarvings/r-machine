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
import type { GearRole } from "./gear-plug.js";
import { type AnyPlugHead, getPlugHead } from "./plug.js";
import type { AnyResOrigin, ResOriginType } from "./res.js";
import type { AnyNamespace } from "./res-domain.js";
import {
  getGearRoleFromLayoutType,
  getResFamilyFromLayoutType,
  isOuterGearLayoutType,
  isVertexGearLayoutType,
  type ResLayoutEntryType,
} from "./res-layout.js";
import { type GearMatrixMeta, tryGetResMatrixMeta } from "./res-matrix.js";
import type { AnyResModule } from "./res-module.js";
import type { ResFamily } from "./res-plug.js";

export interface Blueprint {
  readonly namespace: AnyNamespace;
  readonly locale: AnyLocale | undefined;
  readonly layoutEntryType: ResLayoutEntryType;
  readonly family: ResFamily;
  readonly gearRole: GearRole | undefined;
  readonly isOuterGear: boolean;
  readonly isVertexGear: boolean;
  readonly plugHead: AnyPlugHead | undefined;
  readonly originType: ResOriginType;
  readonly origin: AnyResOrigin;
}

export function createBlueprint(
  module: AnyResModule,
  namespace: AnyNamespace,
  locale: AnyLocale | undefined,
  layoutEntryType: ResLayoutEntryType
): Blueprint {
  const origin = module.r;
  const matrixMeta = tryGetResMatrixMeta(origin);

  if (matrixMeta !== undefined) {
    // This is the source of truth
    const family = getResFamilyFromLayoutType(layoutEntryType);

    const { family: matrixFamily } = matrixMeta;
    if (matrixFamily !== family) {
      throw new RMachineResolveError(
        ERR_RESOLVE_FAILED,
        `Unable to build resource blueprint for namespace "${namespace}" - matrix family "${matrixFamily}" does not match layout entry type "${layoutEntryType}".`
      );
    }

    let gearRole: GearRole | undefined;
    if (matrixFamily === "gear") {
      gearRole = getGearRoleFromLayoutType(layoutEntryType);
      const matrixGearRole = (matrixMeta as GearMatrixMeta).role;
      if (gearRole !== matrixGearRole) {
        throw new RMachineResolveError(
          ERR_RESOLVE_FAILED,
          `Unable to build resource blueprint for namespace "${namespace}" - matrix gear role "${matrixGearRole}" does not match layout entry type "${layoutEntryType}".`
        );
      }
    }
    const isOuterGear = isOuterGearLayoutType(layoutEntryType);
    const isVertexGear = isVertexGearLayoutType(layoutEntryType);

    const plugHead = getPlugHead(origin.plug);
    return {
      namespace,
      locale: family === "shell" ? locale : undefined,
      layoutEntryType,
      family,
      gearRole,
      isOuterGear,
      isVertexGear,
      plugHead,
      originType: "res-matrix",
      origin,
    };
  }

  if (
    layoutEntryType === "shell(mono)" ||
    layoutEntryType === "gear:outer" ||
    layoutEntryType === "gear:outer(vertex)"
  ) {
    throw new RMachineResolveError(
      ERR_RESOLVE_FAILED,
      `Unable to build resource blueprint for namespace "${namespace}" - layout "${layoutEntryType}" requires a matrix factory, got a raw resource.`
    );
  }

  return {
    namespace,
    locale,
    layoutEntryType,
    family: "shell",
    gearRole: undefined,
    isOuterGear: false,
    isVertexGear: false,
    plugHead: undefined,
    originType: "res",
    origin,
  };
}
