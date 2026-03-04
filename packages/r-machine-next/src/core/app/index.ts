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

export {
  type AnyNextAppFlatStrategyConfig,
  type NextAppFlatStrategyConfig,
  NextAppFlatStrategyCore,
  type PartialNextAppFlatStrategyConfig,
} from "./flat/next-app-flat-strategy-core.js";
export {
  createNextAppClientToolset,
  type NextAppClientImpl,
  type NextAppClientRMachine,
  type NextAppClientToolset,
} from "./next-app-client-toolset.js";
export {
  createNextAppNoProxyServerToolset,
  type NextAppNoProxyServerImpl,
  type NextAppNoProxyServerToolset,
} from "./next-app-no-proxy-server-toolset.js";
export {
  createNextAppServerToolset,
  type NextAppServerImpl,
  type NextAppServerRMachine,
  type NextAppServerToolset,
} from "./next-app-server-toolset.js";
export {
  type AnyNextAppStrategyConfig,
  localeHeaderName,
  type NextAppStrategyConfig,
  NextAppStrategyCore,
  type PartialNextAppStrategyConfig,
} from "./next-app-strategy-core.js";
export {
  type AnyNextAppOriginStrategyConfig,
  type LocaleOriginMap,
  type NextAppOriginStrategyConfig,
  NextAppOriginStrategyCore,
  NextAppOriginStrategyUrlTranslator,
  type PartialNextAppOriginStrategyConfig,
} from "./origin/next-app-origin-strategy-core.js";
export {
  type AnyNextAppPathStrategyConfig,
  type NextAppPathStrategyConfig,
  NextAppPathStrategyCore,
  NextAppPathStrategyPathCanonicalizer,
  NextAppPathStrategyPathTranslator,
  type PartialNextAppPathStrategyConfig,
} from "./path/next-app-path-strategy-core.js";
