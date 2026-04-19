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
  type ExtractKit,
  type ExtractResDomain,
  getPlugResolve,
  type PlugBody,
  setPlugResolve,
} from "r-machine/core";
import { RMachineUsageError } from "r-machine/errors";
import { ERR_PLUG_ALREADY_MOCKED } from "#r-machine/testing/errors";
import type { MockSurfaceMap } from "./mock-surface.js";

const plugMockSymbol = Symbol("plugMock");

type ResetPlug = () => void;

interface MapMockPlug<PH extends AnyMapPlugHead> {
  with(data: MockPlugMapData<PH>): ResetPlug;
}

interface ListMockPlug<PH extends AnyListPlugHead> {
  with(data: MockPlugListData<PH>): ResetPlug;
}

interface MockPlug {
  <PH extends AnyMapPlugHead>(plug: PlugBody<PH>): MapMockPlug<PH>;
  <PH extends AnyListPlugHead>(plug: PlugBody<PH>): ListMockPlug<PH>;
}

export const mockPlug: MockPlug = (plug: PlugBody<AnyPlugHead>) => {
  return {
    with: (_data: MockPlugMapData<AnyMapPlugHead> | MockPlugListData<AnyListPlugHead>) => {
      const prevResolve = getPlugResolve(plug);
      if ((prevResolve as any)[plugMockSymbol]) {
        throw new RMachineUsageError(ERR_PLUG_ALREADY_MOCKED, "Plug is already mocked.");
      }

      // TODO: use data to build the mock resolve function
      const resolve = (() => undefined!) as typeof prevResolve;
      (resolve as any)[plugMockSymbol] = true;

      setPlugResolve(plug, resolve);
      return () => {
        setPlugResolve(plug, prevResolve);
      };
    },
  };
};

type MockPlugMapDataDeps<PH extends AnyMapPlugHead> = MockSurfaceMap<ExtractResDomain<PH>, Omit<PH["namespaces"], "$">>;

type TupleToObject<T extends readonly unknown[]> = {
  [K in keyof T as K extends `${number}` ? K : never]: T[K];
};

type MockPlugListDeps<PH extends AnyListPlugHead> = MockSurfaceMap<
  ExtractResDomain<PH>,
  Omit<TupleToObject<PH["namespaces"] extends readonly unknown[] ? PH["namespaces"] : never>, "$">
>;

type MockCtxContent<PH extends AnyPlugHead, C> = {
  [K in keyof C]?: K extends "kit" ? MockSurfaceMap<ExtractResDomain<PH>, ExtractKit<PH>> : C[K];
};

type MockCtx<PH extends AnyPlugHead> = keyof ExtractCtx<PH> extends never
  ? Record<string, never>
  : MockCtxContent<PH, ExtractCtx<PH>>;

type MockPlugMapData<PH extends AnyMapPlugHead> = { $?: MockCtx<PH> } & MockPlugMapDataDeps<PH>;

type MockPlugListData<PH extends AnyListPlugHead> = { $?: MockCtx<PH> } & MockPlugListDeps<PH>;
