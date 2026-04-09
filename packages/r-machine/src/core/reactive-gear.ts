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

import type { ActionBrand } from "./action.js";
import type { GetterBrand } from "./getter.js";
import type { RelayBrand } from "./relay.js";

type AnyReactiveResourceItem = ActionBrand | GetterBrand | RelayBrand | ((...args: any[]) => any);
export interface AnyReactiveResource {
  readonly [key: string]: AnyReactiveResourceItem;
}

declare const reactiveGearFactoryBrand: unique symbol;
interface ReactiveGearFactoryBrand {
  readonly [reactiveGearFactoryBrand]: true;
}
export type ReactiveGearFactory<R extends AnyReactiveResource> = (() => R) & ReactiveGearFactoryBrand;
export type AnyReactiveGearFactory = ReactiveGearFactory<AnyReactiveResource>;
