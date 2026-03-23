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

import type { AnyLocale } from "#r-machine/locale";

// Use strings instead of booleans for better clarity in config and for better DX with intellisense
export type SwitchableOption = "off" | "on";

export type CustomLocaleDetector = () => AnyLocale | Promise<AnyLocale>;

export interface CustomLocaleStore {
  readonly get: () => AnyLocale | undefined | Promise<AnyLocale | undefined>;
  readonly set: (newLocale: AnyLocale) => void | Promise<void>;
}
