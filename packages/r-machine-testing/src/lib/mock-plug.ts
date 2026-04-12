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
  type AnyListPlugHead,
  type AnyMapPlugHead,
  type AnyPlugHead,
  type ExtractCtx,
  type ExtractResAtlas,
  type PartialSurfaceMap,
  type PlugBody,
  plugMockDataSymbol,
  plugResolveSymbol,
} from "r-machine/core";

interface MockPlug {
  <PH extends AnyMapPlugHead>(plug: PlugBody<PH>, data: MockPlugMapData<PH>): () => void;
  <PH extends AnyListPlugHead>(plug: PlugBody<PH>, data: MockPlugListData<PH>): () => void;
}

export const mockPlug: MockPlug = <PH extends AnyPlugHead>(
  plug: PlugBody<PH>,
  data: MockPlugMapData<PH> | MockPlugListData<PH>
): (() => void) => {
  const stdData = plug[plugResolveSymbol]!();
  plug[plugMockDataSymbol] = Object.assign({}, stdData, data); // TODO: WP - partial deep merge for map and list
  return () => {
    plug[plugMockDataSymbol] = undefined;
  };
};

interface MockPlugMapData<PH extends AnyMapPlugHead> {
  $?: Partial<ExtractCtx<PH>>;
  map?: PartialSurfaceMap<ExtractResAtlas<PH>, Omit<PH["namespaces"], "$">>;
}

type TupleToObject<T extends readonly unknown[]> = {
  [K in keyof T as K extends `${number}` ? K : never]: T[K];
};

interface MockPlugListData<PH extends AnyListPlugHead> {
  $?: Partial<ExtractCtx<PH>>;
  list?: Partial<
    PartialSurfaceMap<
      ExtractResAtlas<PH>,
      Omit<TupleToObject<PH["namespaces"] extends readonly unknown[] ? PH["namespaces"] : never>, "$">
    >
  >;
}
