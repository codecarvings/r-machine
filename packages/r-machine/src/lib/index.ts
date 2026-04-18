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

export type { BrandedResource } from "./branded-resource.js";
export {
  RMachine,
  type RMachineLocale,
} from "./r-machine.js";
export type { RMachineConfig, RMachineConfigParams } from "./r-machine-config.js";
export {
  type AnyResAtlasClass,
  type AnyResAtlasInstance,
  type BridgeGearNamespace,
  defaultLayout,
  defineLayout,
  type GateKit,
  type GearKit,
  type ResAtlasBuilder,
  type ResAtlasClass,
  type ResAtlasInstance,
  type RMachineTypeError,
  type ShellKit,
  type ValidBridgeGearItem,
  type ValidBridgeGears,
} from "./resource-atlas.js";
export { getTokenBuilder } from "./token-builder.js";
