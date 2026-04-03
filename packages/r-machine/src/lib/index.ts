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

export type { Atomic, ResourceAtlasOf } from "./__wp_types.js";
export type { AnyR } from "./r.js";
export type { RCtx } from "./r-ctx.js";
export type { AnyNamespaceList, AnyRList, NamespaceList, RList } from "./r-kit.js";
export {
  RMachine,
  type RMachineLocale,
} from "./r-machine.js";
export type { RMachineConfig, RMachineConfigParams } from "./r-machine-config.js";
export type { NamespaceMap } from "./r-map.js";
export type { AnyNamespace, AnyResourceAtlas, Namespace } from "./resource-atlas.js";
export { ofType } from "./type.js";
