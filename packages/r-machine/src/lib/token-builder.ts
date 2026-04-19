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

import {
  type AnyResAtlasClass,
  type AnyResDomain,
  createToken,
  type ExtractRawAtlasShape,
  type Namespace,
  type Token,
} from "#r-machine/core";
import type { RMachineTypeError } from "#r-machine/errors";

type TokenBuilder<RD extends AnyResDomain> = <N extends Namespace<RD>>(namespace: N) => Token<N>;

type DroppedAtlasKeys<RAC extends AnyResAtlasClass> = Exclude<
  keyof ExtractRawAtlasShape<RAC>,
  keyof InstanceType<RAC>["res"]
>;

// Create
export function getTokenBuilder<RAC extends AnyResAtlasClass>(
  ResourceAtlasClass: RAC,
  ..._atlas_error: [DroppedAtlasKeys<RAC>] extends [never]
    ? []
    : [
        RMachineTypeError<`Invalid namespaces declared in atlas shape (dropped by layout filter): *** ${DroppedAtlasKeys<RAC> &
          string} ***`>,
      ]
): TokenBuilder<InstanceType<RAC>["res"]> {
  void ResourceAtlasClass;
  return createToken;
}
