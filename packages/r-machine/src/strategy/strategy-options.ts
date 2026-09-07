/**
 * Copyright (c) 2026 Sergio Turolla
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AnyLocale } from "#r-machine/locale";

export type CustomLocaleDetector = () => AnyLocale | Promise<AnyLocale>;

export interface CustomLocaleStore {
  readonly get: () => AnyLocale | undefined | Promise<AnyLocale | undefined>;
  readonly set: (newLocale: AnyLocale) => void | Promise<void>;
}
