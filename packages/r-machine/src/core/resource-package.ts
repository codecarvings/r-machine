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

import type { AnyResource } from "./resource-origin.js";
import type { AnyResourcePlug } from "./resource-plug.js";

declare const resourcePackageBrand: unique symbol;
export interface ResourcePackage<R extends AnyResource, P extends AnyResourcePlug> {
  readonly [resourcePackageBrand]: true;
  readonly factory: () => Promise<R>;
  readonly plug: P;
}
export type AnyResourcePackage = ResourcePackage<AnyResource, AnyResourcePlug>;
