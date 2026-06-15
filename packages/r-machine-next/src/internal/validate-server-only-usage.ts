/**
 * Copyright (c) 2026 Sergio Turolla
 *
 * This file is part of @r-machine/next, licensed under the
 * GNU Affero General Public License v3.0 (AGPL-3.0-only).
 *
 * You may use, modify, and distribute this file under the terms
 * of the AGPL-3.0. See LICENSE in this package for details.
 *
 * If you need to use this software in a proprietary project,
 * contact: licensing@codecarvings.com
 */

import { RMachineUsageError } from "r-machine/errors";
import React from "react";
import { ERR_SERVER_ONLY } from "#r-machine/next/errors";

const isClient = "useState" in React;

// `testMode` (the owning machine's `testMode.isEnabled`) suppresses the guard so
// server components/pages can be unit-tested in a jsdom/node environment where
// `react` exposes `useState`. Never set in production (the testing package that
// flips it is never imported there).
export function validateServerOnlyUsage(name: string, testMode = false) {
  if (isClient && !testMode) {
    throw new RMachineUsageError(ERR_SERVER_ONLY, `${name} can't be used in Client Components.`);
  }
}
