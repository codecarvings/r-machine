/**
 * Copyright (c) 2026 Sergio Turolla
 * SPDX-License-Identifier: Apache-2.0
 */

import type { NextProxy } from "#r-machine/next/internal";

export interface RMachineProxy extends NextProxy {
  // TODO: Add chainable proxy methods here in the future
}

/**
 * Request header the proxy writes the resolved locale into, and the server
 * toolset reads back, when `autoLocaleBinding` is on. Exported so app code can
 * read the bound locale outside a plug — in a route handler, an instrumentation
 * hook, or anything else holding the request headers.
 */
export const localeHeaderName = "x-rm-locale";
