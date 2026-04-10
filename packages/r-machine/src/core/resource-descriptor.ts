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
import type { AnyResourceOrigin, ResourceFamily } from "./resource.js";
import type { AnyNamespace } from "./resource-atlas.js";
import type { ResourceLayoutType } from "./resource-layout.js";
import { type AnyResourcePackage, tryGetResourcePackageDescriptor } from "./resource-package.js";
import { getResourcePlugDescriptor } from "./resource-plug.js";

type ResourceOriginType = "resource" | "resource-package";

export interface ResourceDescriptor {
  readonly namespace: AnyNamespace;
  readonly locale: AnyLocale | undefined;
  readonly family: ResourceFamily;
  readonly isReactive: boolean;
  readonly isVertex: boolean;
  readonly deps: AnyNamespace[];
  readonly originType: ResourceOriginType;
  readonly origin: AnyResourceOrigin;
}

export function createResourceDescriptor(
  module: AnyModule,
  namespace: AnyNamespace,
  locale: AnyLocale | undefined,
  resourceLayoutType: ResourceLayoutType
): ResourceDescriptor {
  const origin = module.r;
  const packageDescriptor = tryGetResourcePackageDescriptor(origin);

  if (packageDescriptor !== undefined) {
    const { family, isReactive, isVertex } = packageDescriptor;
    const layoutFamily: ResourceFamily = resourceLayoutType === "dynamic-shell" ? "shell" : resourceLayoutType;
    if (family !== layoutFamily) {
      throw new RMachineResolveError(
        ERR_RESOLVE_FAILED,
        `Unable to build descriptor for namespace "${namespace}" - package family "${family}" does not match layout "${resourceLayoutType}".`
      );
    }
    const { deps } = getResourcePlugDescriptor((origin as AnyResourcePackage).plug);
    return {
      namespace,
      locale,
      family,
      isReactive,
      isVertex,
      deps,
      originType: "resource-package",
      origin,
    };
  }

  if (resourceLayoutType === "dynamic-shell") {
    throw new RMachineResolveError(
      ERR_RESOLVE_FAILED,
      `Unable to build descriptor for namespace "${namespace}" - layout "dynamic-shell" requires a shell factory, got a raw resource.`
    );
  }

  return {
    namespace,
    locale,
    family: resourceLayoutType,
    isReactive: false,
    isVertex: false,
    deps: [],
    originType: "resource",
    origin,
  };
}
