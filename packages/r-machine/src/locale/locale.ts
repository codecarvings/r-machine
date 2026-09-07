/**
 * Copyright (c) 2026 Sergio Turolla
 * SPDX-License-Identifier: Apache-2.0
 */

export type AnyLocale = string;

export type AnyLocaleList = readonly AnyLocale[];

export type LocaleList<L extends AnyLocale> = readonly L[];
