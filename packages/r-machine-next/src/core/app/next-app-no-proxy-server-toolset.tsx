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

import type { RMachine } from "r-machine";
import type { AnyResAtlas, AnyResEquipment, ExperimentalFlags } from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import type { AnyPathAtlas, NextServerPlugKitMap } from "#r-machine/next/core";
import type { CookiesFn, HeadersFn } from "#r-machine/next/internal";
import type { NextAppClientRMachine } from "./next-app-client-toolset.js";
import {
  createNextAppServerToolset,
  type NextAppServerImpl,
  type NextAppServerToolset,
} from "./next-app-server-toolset.js";

export interface NextAppNoProxyServerToolset<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  SKM extends NextServerPlugKitMap<RA>,
  PA extends AnyPathAtlas,
  LK extends string,
> extends Omit<NextAppServerToolset<RA, L, SKM, PA, LK>, "rMachineProxy"> {
  readonly routeHandlers: routeHandlers;
}

interface routeHandlers {
  readonly entrance: {
    readonly GET: () => Promise<void>;
  };
}

export interface NextAppNoProxyServerImpl<L extends AnyLocale, LK extends string> extends NextAppServerImpl<L, LK> {
  readonly createRouteHandlers: (cookies: CookiesFn, headers: HeadersFn) => routeHandlers | Promise<routeHandlers>;
}

export async function createNextAppNoProxyServerToolset<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  E extends AnyResEquipment<RA>,
  EF extends ExperimentalFlags,
  SKM extends NextServerPlugKitMap<RA>,
  PA extends AnyPathAtlas,
  LK extends string,
>(
  rMachine: RMachine<RA, L, E, EF>,
  serverKit: SKM,
  impl: NextAppNoProxyServerImpl<L, LK>,
  NextClientRMachine: NextAppClientRMachine<L>
): Promise<NextAppNoProxyServerToolset<RA, L, SKM, PA, LK>> {
  const { rMachineProxy: _rMachineProxy, ...otherTools } = await createNextAppServerToolset<RA, L, E, EF, SKM, PA, LK>(
    rMachine,
    serverKit,
    impl,
    NextClientRMachine
  );

  // Dynamic import to bypass the "next/headers" import issue in pages/ directory
  // (next/headers only works in Server Components / App Router).
  const { cookies, headers } = await import("next/headers");

  const routeHandlers = await impl.createRouteHandlers(cookies, headers);

  return {
    ...otherTools,
    routeHandlers,
  };
}
