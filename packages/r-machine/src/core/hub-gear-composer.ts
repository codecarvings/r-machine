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
import type { HubGearListDefiner, HubGearMapDefiner } from "./hub-gear.js";
import { getPlugOutline, type PluginCtx } from "./plug.js";
import type { AnyRes } from "./res.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { ResComposerConnector } from "./res-composer-connector.js";
import type { Handle } from "./res-domain.js";
import type { HandleList } from "./res-list.js";
import type { HandleMap } from "./res-map.js";
import { createResMatrix, type GearMatrixMeta } from "./res-matrix.js";

type ValidHubGearDepItem<RA extends AnyResAtlas, H> =
  H extends Handle<RA["shape@gear:hub"]>
    ? H
    : H extends string
      ? RMachineTypeError<`Namespace '${H}' is not valid for a hub gear plug.`>
      : RMachineTypeError<"This token does not reference a valid namespace for a hub gear plug.">;

export interface HubGearComposer<RA extends AnyResAtlas, KM extends HandleMap<RA>> {
  readonly deps: HubGearDepsComposer<RA, KM>;
  readonly define: HubGearMapDefiner<RA, KM, {}>;
}

interface HubGearDepsComposer<RA extends AnyResAtlas, KM extends HandleMap<RA>> {
  (): HubGearMapComposer<RA, KM, {}>;
  <const NL extends readonly Handle<RA["shape"]>[]>(
    ...deps: { readonly [I in keyof NL]: ValidHubGearDepItem<RA, NL[I]> }
  ): HubGearListComposer<RA, KM, NL>;
  <const NM extends { readonly [k: string]: Handle<RA["shape"]> }>(
    deps: { readonly [K in keyof NM]: ValidHubGearDepItem<RA, NM[K]> }
  ): HubGearMapComposer<RA, KM, NM>;
}

interface HubGearMapComposer<RA extends AnyResAtlas, KM extends HandleMap<RA>, DM extends HandleMap<RA>> {
  readonly define: HubGearMapDefiner<RA, KM, DM>;
}

interface HubGearListComposer<RA extends AnyResAtlas, KM extends HandleMap<RA>, DL extends HandleList<RA>> {
  readonly define: HubGearListDefiner<RA, KM, DL>;
}

// #region Runtime

const meta: GearMatrixMeta = { family: "gear", role: "hub" };

const cursor = undefined;

export function createHubGearComposer<RA extends AnyResAtlas, KM extends HandleMap<RA>>(
  connector: ResComposerConnector
): HubGearComposer<RA, KM> {
  const define = createHubGearMapDefiner<RA, KM, {}>(connector, {});

  const deps = ((...args: unknown[]) => {
    const mask = getPlugOutline<RA>(...args);
    if (mask.mode === "map") {
      return createHubGearMapDepsComposer<RA, KM, any>(connector, mask.deps);
    } else {
      return createHubGearListDepsComposer<RA, KM, any>(connector, mask.deps);
    }
  }) as HubGearDepsComposer<RA, KM>;

  return {
    deps,
    define,
  };
}

function createHubGearMapDepsComposer<RA extends AnyResAtlas, KM extends HandleMap<RA>, DM extends HandleMap<RA>>(
  connector: ResComposerConnector,
  deps: DM
): HubGearMapComposer<RA, KM, DM> {
  return lazyGetters({
    define: () => createHubGearMapDefiner<RA, KM, DM>(connector, deps),
  });
}

function createHubGearListDepsComposer<RA extends AnyResAtlas, KM extends HandleMap<RA>, DL extends HandleList<RA>>(
  connector: ResComposerConnector,
  deps: DL
): HubGearListComposer<RA, KM, DL> {
  return lazyGetters({
    define: () => createHubGearListDefiner<RA, KM, DL>(connector, deps),
  });
}

function createHubGearMapDefiner<RA extends AnyResAtlas, KM extends HandleMap<RA>, DM extends HandleMap<RA>>(
  connector: ResComposerConnector,
  deps: DM
): HubGearMapDefiner<RA, KM, DM> {
  const head = createGearMapPlugHead<"hub", RA, KM, DM, PluginCtx<RA, KM>>("hub", deps);

  return (factory: (plugin: never, cursor: never) => unknown) =>
    createResMatrix({
      connector,
      meta,
      head,
      cursor,
      userFactory: factory as (plugin: unknown) => AnyRes | Promise<AnyRes>,
    });
}

function createHubGearListDefiner<RA extends AnyResAtlas, KM extends HandleMap<RA>, DL extends HandleList<RA>>(
  connector: ResComposerConnector,
  deps: DL
): HubGearListDefiner<RA, KM, DL> {
  const head = createGearListPlugHead<"hub", RA, KM, DL, PluginCtx<RA, KM>>("hub", deps);

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
