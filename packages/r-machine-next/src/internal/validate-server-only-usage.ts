/**
 * Copyright (c) 2026 Sergio Turolla and R-Machine contributors
 * SPDX-License-Identifier: Apache-2.0
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
