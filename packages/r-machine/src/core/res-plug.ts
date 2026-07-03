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

import type { ListPlugHead, MapPlugHead, PlugBody, PluginCtx, ShellDepMap } from "./plug.js";
import type { AnyResAtlas } from "./res-atlas.js";
import { type AnyNamespace, getNamespace, isShellPicker } from "./res-domain.js";
import type { HandleList } from "./res-list.js";
import type { HandleMap } from "./res-map.js";

export type ResFamily = "gear" | "shell";

export interface AnyPortMap {
  readonly [key: string]: unknown;
}

export type ResPluginCtx<RA extends AnyResAtlas, KM extends HandleMap<RA>, PM extends AnyPortMap> = PluginCtx<RA, KM> &
  (keyof PM extends never ? {} : { readonly ports: PM });

export interface ResMapPlugHead<
  F extends ResFamily,
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
  PM extends AnyPortMap,
  CTX extends ResPluginCtx<RA, KM, PM>,
> extends MapPlugHead<"res", RA, KM, DM, CTX> {
  readonly family: F;
  readonly ports: PM;
}
type AnyResMapPlugHead = ResMapPlugHead<ResFamily, any, any, any, any, any>;

export function createResMapPlugHead<
  F extends ResFamily,
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DM extends HandleMap<RA>,
  PM extends AnyPortMap,
  CTX extends ResPluginCtx<RA, KM, PM>,
>(family: F, deps: DM, ports: PM): ResMapPlugHead<F, RA, KM, DM, PM, CTX> {
  // Partition: normal deps → nsDeps (eager, resolved to surfaces); shell picker deps
  // → shellDeps (locale loaders injected by the matrix), kept out of nsDeps and
  // nsDepList so no locale-free resolve is attempted at init.
  const nsDeps: Record<string, AnyNamespace> = {};
  const shellDeps: Record<string, AnyNamespace> = {};
  for (const key in deps) {
    const handle = deps[key];
    if (isShellPicker(handle)) {
      shellDeps[key] = getNamespace(handle);
    } else {
      nsDeps[key] = getNamespace(handle);
    }
  }
  const nsDepList = Object.values(nsDeps);
  return {
    realm: "res",
    family,
    mode: "map",
    deps,
    nsDeps,
    nsDepList,
    shellDeps: hasKeys(shellDeps) ? (shellDeps as ShellDepMap) : undefined,
    ports,
  } as unknown as ResMapPlugHead<F, RA, KM, DM, PM, CTX>;
}

function hasKeys(o: Record<string, unknown>): boolean {
  for (const _ in o) {
    return true;
  }
  return false;
}

export interface ResListPlugHead<
  F extends ResFamily,
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
  PM extends AnyPortMap,
  CTX extends ResPluginCtx<RA, KM, PM>,
> extends ListPlugHead<"res", RA, KM, DL, CTX> {
  readonly family: F;
  readonly ports: PM;
}
type AnyResListPlugHead = ResListPlugHead<ResFamily, any, any, any, any, any>;

export function createResListPlugHead<
  F extends ResFamily,
  RA extends AnyResAtlas,
  KM extends HandleMap<RA>,
  DL extends HandleList<RA>,
  PM extends AnyPortMap,
  CTX extends ResPluginCtx<RA, KM, PM>,
>(family: F, deps: DL, ports: PM): ResListPlugHead<F, RA, KM, DL, PM, CTX> {
  // Partition (list form): shell picker deps are recorded by ORIGINAL index in
  // shellDeps and removed from nsDeps (compacted). The matrix re-inserts each
  // loader at its original tuple position (see injectShellPickers in res-matrix).
  const nsDeps: AnyNamespace[] = [];
  const shellDeps: Record<string, AnyNamespace> = {};
  deps.forEach((handle, index) => {
    if (isShellPicker(handle)) {
      shellDeps[String(index)] = getNamespace(handle);
    } else {
      nsDeps.push(getNamespace(handle));
    }
  });
  return {
    realm: "res",
    family,
    mode: "list",
    deps,
    nsDeps,
    nsDepList: nsDeps,
    shellDeps: hasKeys(shellDeps) ? (shellDeps as ShellDepMap) : undefined,
    ports,
  } as unknown as ResListPlugHead<F, RA, KM, DL, PM, CTX>;
}

export type AnyResPlugHead = AnyResMapPlugHead | AnyResListPlugHead;
export type AnyResPlug = PlugBody<AnyResPlugHead>;
