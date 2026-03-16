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

import type { AnyLocale, AnyResourceAtlas, RMachine } from "r-machine";
import type { AnyPathAtlas } from "#r-machine/next/core";
import type { CookiesFn, HeadersFn } from "#r-machine/next/internal";
import type { NextAppClientRMachine } from "./next-app-client-toolset.js";
import {
  createNextAppServerToolset,
  type NextAppServerImpl,
  type NextAppServerToolset,
} from "./next-app-server-toolset.js";

export interface NextAppNoProxyServerToolset<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  PA extends AnyPathAtlas,
  LK extends string,
> extends Omit<NextAppServerToolset<RA, L, PA, LK>, "rMachineProxy"> {
  readonly routeHandlers: routeHandlers;
}

interface routeHandlers {
  readonly entrance: {
    readonly GET: () => Promise<void>;
  };
}

export interface NextAppNoProxyServerImpl<L extends AnyLocale> extends NextAppServerImpl<L> {
  readonly createRouteHandlers: (
    cookies: CookiesFn,
    headers: HeadersFn,
    setLocale: (newLocale: L) => Promise<void>
  ) => routeHandlers | Promise<routeHandlers>;
}

export async function createNextAppNoProxyServerToolset<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  PA extends AnyPathAtlas,
  LK extends string,
>(
  rMachine: RMachine<RA, L>,
  impl: NextAppNoProxyServerImpl<L>,
  NextClientRMachine: NextAppClientRMachine<L>
): Promise<NextAppNoProxyServerToolset<RA, L, PA, LK>> {
  const {
    rMachineProxy: _rMachineProxy,
    setLocale,
    ...otherTools
  } = await createNextAppServerToolset<RA, L, PA, LK>(rMachine, impl, NextClientRMachine);

  // Use dynamic import to bypass the "next/headers" import issue in pages/ directory
  // You're importing a component that needs "next/headers". That only works in a Server Component which is not supported in the pages/ directory. Read more: https://nextjs.org/docs/app/building-your-application/rendering/server-components
  const { cookies, headers } = await import("next/headers");

  const routeHandlers = await impl.createRouteHandlers(cookies, headers, setLocale);

  return {
    ...otherTools,
    setLocale,
    routeHandlers,
  };
}
