/**
 * Copyright (c) 2026 Sergio Turolla and R-Machine contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export type Prettify<T> = { [K in keyof T]: T[K] } & {};
