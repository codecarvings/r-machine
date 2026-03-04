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

export function validateServerOnlyUsage(name: string) {
  if (isClient) {
    throw new RMachineUsageError(ERR_SERVER_ONLY, `${name} can't be used in Client Components.`);
  }
}
