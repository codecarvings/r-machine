/**
 * Copyright (c) 2026 Sergio Turolla
 * SPDX-License-Identifier: Apache-2.0
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
export { PathCanonicalizer } from "./path-canonicalizer.js";
export { localeHeaderName, type RMachineProxy } from "./proxy.js";
