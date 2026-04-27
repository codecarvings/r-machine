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

import type { RMachineTypeError } from "#r-machine/errors";
import { lazyGetters } from "./composer-utils.js";
import { createGearListPlugHead, createGearMapPlugHead } from "./gear-plug.js";
import type { InnerGearListDefiner, InnerGearMapDefiner } from "./inner-gear.js";
import { getPlugOutline, type PluginCtx } from "./plug.js";
import type { AnyRes } from "./res.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { ResComposerConnector } from "./res-composer-connector.js";
import type { Handle } from "./res-domain.js";
import type { HandleList } from "./res-list.js";
import type { HandleMap } from "./res-map.js";
import { createResMatrix, type GearMatrixMeta } from "./res-matrix.js";

type ValidInnerGearDepItem<RA extends AnyResAtlas, H> =
  H extends Handle<RA["valid@gear:inner"]>
    ? H
    : H extends string
      ? RMachineTypeError<`Namespace '${H}' is not valid for an inner gear plug.`>
      : RMachineTypeError<"This token does not reference a valid namespace for an inner gear plug.">;

export interface InnerGearComposer<RA extends AnyResAtlas, KM extends HandleMap<RA>> {
  readonly deps: InnerGearDepsComposer<RA, KM>;
  readonly define: InnerGearMapDefiner<RA, KM, {}>;
}

interface InnerGearDepsComposer<RA extends AnyResAtlas, KM extends HandleMap<RA>> {
  (): InnerGearMapComposer<RA, KM, {}>;
  <const NL extends readonly Handle<RA["shape"]>[]>(
    ...deps: { readonly [I in keyof NL]: ValidInnerGearDepItem<RA, NL[I]> }
  ): InnerGearListComposer<RA, KM, NL>;
  <const NM extends { readonly [k: string]: Handle<RA["shape"]> }>(
    deps: { readonly [K in keyof NM]: ValidInnerGearDepItem<RA, NM[K]> }
  ): InnerGearMapComposer<RA, KM, NM>;
}

interface InnerGearMapComposer<RA extends AnyResAtlas, KM extends HandleMap<RA>, DM extends HandleMap<RA>> {
  readonly define: InnerGearMapDefiner<RA, KM, DM>;
}

interface InnerGearListComposer<RA extends AnyResAtlas, KM extends HandleMap<RA>, DL extends HandleList<RA>> {
  readonly define: InnerGearListDefiner<RA, KM, DL>;
}

// #region Runtime

const meta: GearMatrixMeta = { family: "gear", role: "inner" };

const cursor = undefined;

export function createInnerGearComposer<RA extends AnyResAtlas, KM extends HandleMap<RA>>(
  connector: ResComposerConnector
): InnerGearComposer<RA, KM> {
  const define = createInnerGearMapDefiner<RA, KM, {}>(connector, {});

  const deps = ((...args: unknown[]) => {
    const mask = getPlugOutline<RA>(...args);
    if (mask.mode === "map") {
      return createInnerGearMapDepsComposer<RA, KM, any>(connector, mask.deps);
    } else {
      return createInnerGearListDepsComposer<RA, KM, any>(connector, mask.deps);
    }
  }) as InnerGearDepsComposer<RA, KM>;

  return {
    deps,
    define,
  };
}

function createInnerGearMapDepsComposer<RA extends AnyResAtlas, KM extends HandleMap<RA>, DM extends HandleMap<RA>>(
  connector: ResComposerConnector,
  deps: DM
): InnerGearMapComposer<RA, KM, DM> {
  return lazyGetters({
    define: () => createInnerGearMapDefiner<RA, KM, DM>(connector, deps),
  });
}

function createInnerGearListDepsComposer<RA extends AnyResAtlas, KM extends HandleMap<RA>, DL extends HandleList<RA>>(
  connector: ResComposerConnector,
  deps: DL
): InnerGearListComposer<RA, KM, DL> {
  return lazyGetters({
    define: () => createInnerGearListDefiner<RA, KM, DL>(connector, deps),
  });
}

function createInnerGearMapDefiner<RA extends AnyResAtlas, KM extends HandleMap<RA>, DM extends HandleMap<RA>>(
  connector: ResComposerConnector,
  deps: DM
): InnerGearMapDefiner<RA, KM, DM> {
  const head = createGearMapPlugHead<"inner", RA, KM, DM, PluginCtx<RA, KM>>("inner", deps);

  return (factory: (plugin: never, cursor: never) => unknown) =>
    createResMatrix({
      connector,
      meta,
      head,
      cursor,
      userFactory: factory as (plugin: unknown) => AnyRes | Promise<AnyRes>,
    });
}

function createInnerGearListDefiner<RA extends AnyResAtlas, KM extends HandleMap<RA>, DL extends HandleList<RA>>(
  connector: ResComposerConnector,
  deps: DL
): InnerGearListDefiner<RA, KM, DL> {
  const head = createGearListPlugHead<"inner", RA, KM, DL, PluginCtx<RA, KM>>("inner", deps);

  return (factory: (plugin: never) => unknown) =>
    createResMatrix({
      connector,
      meta,
      head,
      cursor,
      userFactory: factory as (plugin: unknown) => AnyRes | Promise<AnyRes>,
    });
}

// #endregion
