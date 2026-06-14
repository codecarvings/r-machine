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

export { HrefCanonicalizer } from "./href-canonicalizer.js";
export { HrefTranslator } from "./href-translator.js";
export type { NextClientPlugDefiner, NextClientPlugKitMap } from "./next-client-plug.js";
export type { NextServerPlugDefiner, NextServerPlugKitMap } from "./next-server-plug.js";
export type { BoundPathComposer, PathParamMap, PathParams, PathSelector } from "./path.js";
export {
  type AnyPathAtlas,
  type AnySegment,
  type BuiltPathAtlas,
  buildPathAtlas,
  type PathAtlas,
  type PathAtlasClass,
  type Segment,
} from "./path-atlas.js";
export type { RMachineProxy } from "./proxy.js";
