/**
 * Copyright (c) 2026 Sergio Turolla
 * SPDX-License-Identifier: Apache-2.0
 */

export type Prettify<T> = { [K in keyof T]: T[K] } & {};
