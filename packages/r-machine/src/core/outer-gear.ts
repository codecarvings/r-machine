/**
 * Copyright (c) 2026 Sergio Turolla and R-Machine contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ActionBrand } from "./action.js";
import type { GetterBrand } from "./getter.js";
import type { RelayBrand } from "./relay.js";

type AnyOuterGearItem = ActionBrand | GetterBrand | RelayBrand | ((...args: any[]) => any);
export interface AnyOuterGear {
  [key: string]: AnyOuterGearItem;
}

export type RejectAsyncValueProps<R> = {
  readonly [K in keyof R]: R[K] extends (...args: any[]) => Promise<void>
    ? R[K]
    : R[K] extends (...args: any[]) => Promise<any>
      ? never
      : R[K];
};
