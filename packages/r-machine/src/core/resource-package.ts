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

import type { AnyResource, AnyResourceOrigin, ResourceFamily } from "./resource.js";
import type { AnyResourcePlug } from "./resource-plug.js";

export interface ResourcePackageDescriptor {
  readonly family: ResourceFamily;
  readonly isReactive: boolean;
  readonly isVertex: boolean;
}

const resourcePackageDescriptor: unique symbol = Symbol("resourcePackageDescriptor");
export interface ResourcePackage<R extends AnyResource, P extends AnyResourcePlug> {
  readonly [resourcePackageDescriptor]: ResourcePackageDescriptor;
  readonly factory: () => Promise<R>;
  readonly plug: P;
}
export type AnyResourcePackage = ResourcePackage<AnyResource, AnyResourcePlug>;

export function createResourcePackage<R extends AnyResource, P extends AnyResourcePlug>(
  descriptor: ResourcePackageDescriptor,
  factory: () => Promise<R>,
  plug: P
): ResourcePackage<R, P> {
  return {
    [resourcePackageDescriptor]: descriptor,
    factory,
    plug,
  };
}

export function tryGetResourcePackageDescriptor(origin: AnyResourceOrigin): ResourcePackageDescriptor | undefined {
  return (origin as Partial<AnyResourcePackage>)[resourcePackageDescriptor];
}
