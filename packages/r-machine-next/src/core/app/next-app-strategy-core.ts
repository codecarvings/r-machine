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

import type { AnyResAtlas, AnyResEquipment, ExperimentalFlags, SwitchableOption } from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import { Strategy } from "r-machine/strategy";
import type {
  AnyPathAtlas,
  BuiltPathAtlas,
  NextClientPlugKitMap,
  NextServerPlugKitMap,
  PathAtlasClass,
} from "#r-machine/next/core";
import type { NextAppClientImpl, NextAppClientRMachine, NextAppClientToolset } from "./next-app-client-toolset.js";
import type { NextAppServerImpl, NextAppServerToolset } from "./next-app-server-toolset.js";

export const localeHeaderName = "x-rm-locale";

// ── Per-rMachine toolset cache ──────────────────────────────────────────────
// `createClientToolset`/`createServerToolset` memoize their result on the
// `rMachine` instance. This is what keeps the jiti dev loader working: a
// resource module reached through the graph (OuterGear → server action →
// `server-toolset.ts`) re-imports `server-toolset`, which re-runs
// `createServerToolset`. Because `rMachine` is a dev-time process singleton,
// the jiti-loaded copy finds the REAL toolset Next already built and reuses it,
// instead of re-running `createServerImpl` — whose strategy server-impl
// statically imports `next/*` entrypoints that jiti's pure-ESM resolution can't
// load (ERR_MODULE_NOT_FOUND on `next/navigation`).
//
// The ordering is guaranteed by construction: using any Server/ClientPlug
// requires `server-toolset` to have been imported first, and its top-level
// await builds (and caches) the toolset before any render resolves a resource.
// The client side is additionally fenced by the dev loader's `"use client"`
// stub, so under jiti `createClientToolset` is never reached at all. In
// production each toolset is built once, so the cache is a harmless memo.
//
// Note: on a cache hit the `NextClientRMachine` argument to
// `createServerToolset` is ignored. It is the same value across calls, and
// under jiti it is the stub — which is exactly what we want to discard.
const CLIENT_TOOLSET_SLOT = Symbol.for("@r-machine/next:client-toolset");
const SERVER_TOOLSET_SLOT = Symbol.for("@r-machine/next:server-toolset");

interface ToolsetCacheHost {
  [CLIENT_TOOLSET_SLOT]?: unknown;
  [SERVER_TOOLSET_SLOT]?: unknown;
}

// `verifyResourceAtlas` sets this flag (via `Symbol.for`, cross-package) to
// force the jiti dev loader to activate when there is no real Next runtime.
// Presence of the flag is therefore our signal for "the dev loader is running
// without Next" — see `createServerToolset`.
const FORCE_DEV_LOADER_FLAG = Symbol.for("@r-machine:force-dev-loader");

function isDevLoaderForced(): boolean {
  const slot = globalThis as unknown as { [FORCE_DEV_LOADER_FLAG]?: number };
  return (slot[FORCE_DEV_LOADER_FLAG] ?? 0) > 0;
}

// An inert stand-in for a server toolset, used only under the forced dev loader
// (see `createServerToolset`). Every member reads back as a no-op function, so a
// resource module that defines `ServerPlug("…")` at load time doesn't crash —
// while `then` reads as `undefined` so the object is not mistaken for a thenable
// when an `async` method returns it (which would hang the awaiting caller).
function createInertToolset(): unknown {
  const noop = () => undefined;
  return new Proxy(
    {},
    {
      get: (_target, prop) => (prop === "then" ? undefined : noop),
    }
  );
}

export interface NextAppStrategyConfig<
  RA extends AnyResAtlas,
  CKM extends NextClientPlugKitMap<RA>,
  SKM extends NextServerPlugKitMap<RA>,
  PA extends AnyPathAtlas,
  LK extends string,
> {
  readonly clientKit: CKM;
  readonly serverKit: SKM;
  readonly PathAtlas: PathAtlasClass<PA>;
  readonly localeKey: LK;
  readonly autoLocaleBinding: SwitchableOption;
  readonly basePath: string;
  /**
   * Enable coexistence with React Compiler in client components. When `on`,
   * reactive surfaces from `ClientPlug(...).useR()` are handed a fresh identity
   * per reactive re-render so the compiler re-evaluates the reading scopes. Off
   * by default and DISCOURAGED — R-Machine reactivity is already read-driven, so
   * the compiler adds little while this wrapping adds overhead.
   */
  readonly reactCompiler: SwitchableOption;
}
export type AnyNextAppStrategyConfig = NextAppStrategyConfig<any, any, any, any, any>;
export interface NextAppStrategyConfigParams<
  RA extends AnyResAtlas,
  CKM extends NextClientPlugKitMap<RA>,
  SKM extends NextServerPlugKitMap<RA>,
  PA extends AnyPathAtlas,
  LK extends string,
> {
  readonly clientKit?: CKM;
  readonly serverKit?: SKM;
  readonly PathAtlas?: PathAtlasClass<PA>;
  readonly localeKey?: LK;
  readonly autoLocaleBinding?: SwitchableOption;
  readonly basePath?: string;
  readonly reactCompiler?: SwitchableOption;
}

const defaultKit = {} as const;
// Need to export otherwise TS will expose the type as { segment: any; }
export class DefaultPathAtlas {
  readonly segment: any = {};
}
const defaultLocaleKey = "locale" as const;
const defaultConfig: NextAppStrategyConfig<
  AnyResAtlas,
  typeof defaultKit,
  typeof defaultKit,
  DefaultPathAtlas,
  typeof defaultLocaleKey
> = {
  clientKit: defaultKit,
  serverKit: defaultKit,
  PathAtlas: DefaultPathAtlas,
  localeKey: defaultLocaleKey,
  autoLocaleBinding: "off",
  basePath: "",
  reactCompiler: "off",
};

export abstract class NextAppStrategyCore<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  E extends AnyResEquipment<RA>,
  EF extends ExperimentalFlags,
  C extends AnyNextAppStrategyConfig,
> extends Strategy<RA, L, E, EF, C> {
  static readonly defaultConfig = defaultConfig;

  protected abstract readonly pathAtlas: BuiltPathAtlas<InstanceType<C["PathAtlas"]>>;

  protected abstract createClientImpl(): Promise<NextAppClientImpl<L>>;
  protected abstract createServerImpl(): Promise<NextAppServerImpl<L, C["localeKey"]>>;

  async createClientToolset(): Promise<NextAppClientToolset<RA, L, EF, C["clientKit"], InstanceType<C["PathAtlas"]>>> {
    type Toolset = NextAppClientToolset<RA, L, EF, C["clientKit"], InstanceType<C["PathAtlas"]>>;
    // Reuse the toolset already cached on this rMachine — see the cache note above.
    const host = this.rMachine as unknown as ToolsetCacheHost;
    const cached = host[CLIENT_TOOLSET_SLOT];
    if (cached) {
      return cached as Toolset;
    }

    const impl = await this.createClientImpl();
    const module = await import("./next-app-client-toolset.js");
    // Cache only after a successful build, so a failed `createClientImpl` is retryable.
    const result = module.createNextAppClientToolset(this.rMachine, this.config.clientKit, impl, {
      reactCompiler: this.config.reactCompiler === "on",
    });

    host[CLIENT_TOOLSET_SLOT] = result;
    return result as Promise<Toolset>;
  }

  async createServerToolset(
    NextClientRMachine: NextAppClientRMachine<L>
  ): Promise<NextAppServerToolset<RA, L, C["serverKit"], InstanceType<C["PathAtlas"]>, C["localeKey"]>> {
    type Toolset = NextAppServerToolset<RA, L, C["serverKit"], InstanceType<C["PathAtlas"]>, C["localeKey"]>;
    // Reuse the toolset already cached on this rMachine — see the cache note
    // above. On a cache hit `NextClientRMachine` is intentionally ignored.
    const host = this.rMachine as unknown as ToolsetCacheHost;
    const cached = host[SERVER_TOOLSET_SLOT];
    if (cached) {
      return cached as Toolset;
    }

    // No real Next runtime (verifyResourceAtlas forces the dev loader): there is
    // no bundler to resolve the strategy server-impl's `next/*` imports, and the
    // verifier only loads modules (never runs factories). Hand back an inert
    // toolset instead of constructing — which would crash on `next/navigation`.
    // The real app never reaches this: Next builds the toolset and the cache is
    // warm before any jiti load resolves a resource. (The client side is fenced
    // earlier by the dev loader's `"use client"` stub, so only the server side
    // needs this.)
    if (isDevLoaderForced()) {
      return createInertToolset() as Toolset;
    }

    const impl = await this.createServerImpl();
    const module = await import("./next-app-server-toolset.js");
    // Cache only after a successful build, so a failed `createServerImpl` is retryable.
    const result = module.createNextAppServerToolset(this.rMachine, this.config.serverKit, impl, NextClientRMachine);

    host[SERVER_TOOLSET_SLOT] = result;
    return result as Promise<Toolset>;
  }
}
