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

export type { NextAppClientImpl, NextAppClientRMachine, NextAppClientToolset } from "./next-app-client-toolset.js";
export type { NextAppNoProxyServerImpl, NextAppNoProxyServerToolset } from "./next-app-no-proxy-server-toolset.js";
export type { NextAppServerImpl, NextAppServerToolset } from "./next-app-server-toolset.js";
export {
  localeHeaderName,
  type NextAppStrategyConfig,
  type NextAppStrategyConfigParams,
  NextAppStrategyCore,
} from "./next-app-strategy-core.js";
