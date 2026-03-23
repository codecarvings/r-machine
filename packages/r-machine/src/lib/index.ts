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

export {
  type AnyFmtProvider,
  type EmptyFmtProvider,
  EmptyFmtProviderCtor,
  type ExtractFmt,
} from "./fmt.js";
export { FormattersSeed } from "./formatters-seed.js";
export type { AnyNamespace, AnyR, AnyResourceAtlas, Namespace, R } from "./r.js";
export type { AnyNamespaceList, AnyRKit, NamespaceList, RKit } from "./r-kit.js";
export {
  RMachine,
  type RMachineLocale,
  type RMachineRCtx,
} from "./r-machine.js";
export type { RMachineConfig, RMachineConfigParams } from "./r-machine-config.js";
export type { RCtx } from "./r-module.js";
