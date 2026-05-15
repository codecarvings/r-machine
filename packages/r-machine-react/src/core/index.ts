/**
 * Copyright (c) 2026 Sergio Turolla
 *
 * This file is part of @r-machine/react, licensed under the
 * GNU Affero General Public License v3.0 (AGPL-3.0-only).
 *
 * You may use, modify, and distribute this file under the terms
 * of the AGPL-3.0. See LICENSE in this package for details.
 *
 * If you need to use this software in a proprietary project,
 * contact: licensing@codecarvings.com
 */

import type { VertexFrame } from "./vertex-frame.js";

export {
  createReactBareToolset,
  type ReactBareRMachine,
  type ReactBareToolset,
} from "./react-bare-toolset.js";
export type { ReactPlugKitMap } from "./react-plug.js";
export {
  type AnyReactStandardStrategyConfig,
  type ReactStandardStrategyConfig,
  type ReactStandardStrategyConfigParams,
  ReactStandardStrategyCore,
} from "./react-standard-strategy-core.js";
export { ReactStrategyCore } from "./react-strategy-core.js";
export {
  createReactToolset,
  type ReactImpl,
  type ReactToolset,
} from "./react-toolset.js";
export { RequestScopeContext } from "./scope-context.js";

export type VertexFrameType = typeof VertexFrame;
