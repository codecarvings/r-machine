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

export { getResolveContext } from "../core/resolve-context.js";
export type { BrandedResource } from "./branded-resource.js";
export { enableRMachineDevMode } from "./dev-mode.js";
export { dispose } from "./dispose.js";
export { defineLayout } from "./layout.js";
export { RMachine, type RMachineLocale } from "./r-machine.js";
export { CONFIG_ACCESSOR, type RMachineConfig } from "./r-machine-config.js";
