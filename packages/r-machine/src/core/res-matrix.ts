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

import type { AnyLocale } from "#r-machine/locale";
import type { GearRole } from "./gear-plug.js";
import { createPlug, getPlugResolve, type PluginCtxAugmenter, setPlugResolve } from "./plug.js";
import type { AnyRes, AnyResOrigin } from "./res.js";
import type { ResComposerConnector } from "./res-composer-connector.js";
import type { AnyNamespace } from "./res-domain.js";
import type { AnyResPlug, AnyResPlugHead } from "./res-plug.js";

export interface GearMatrixMeta {
  readonly family: "gear";
  readonly role: GearRole;
}

export interface ShellMatrixMeta {
  readonly family: "shell";
}

// Forces T (the inferred return type of a clone fn) to expose only keys that
// exist on R. Any extra key K in T is rewritten to `never`, so a literal that
// carries an unknown property fails to satisfy the constraint at the call
// site. Phase 1 of the clone API keeps the result shape locked to R; users
// who genuinely want to widen the resource should reach for a future,
// differently-named method instead of leaking extras through .clone().
export type NoExcess<R, T> = T & { [K in Exclude<keyof T, keyof R>]: never };

type ResMatrixMeta = GearMatrixMeta | ShellMatrixMeta;

const resMatrixMetaSymbol: unique symbol = Symbol("resMatrixMeta");

// Cannot use ResMatrix<R extends AnyRes, ...> because of res tags.
// The base type carries only what's universally observable: identity (meta),
// resolution (`create`) and the plug. Derivation methods (`clone`, `withPorts`,
// `withState`) live on the specialized matrix types — each family knows
// what's meaningful to override, and the typing stays strict there.
export interface ResMatrix<R, P extends AnyResPlug> {
  readonly [resMatrixMetaSymbol]: ResMatrixMeta;
  readonly create: () => Promise<R>;
  readonly plug: P;
}

export type AnyResMatrix = ResMatrix<any, any>;

export function tryGetResMatrixMeta(origin: AnyResOrigin): ResMatrixMeta | undefined {
  return (origin as Partial<AnyResMatrix>)[resMatrixMetaSymbol];
}

type CursorFactory = (plugin: unknown, selfNs?: AnyNamespace) => unknown;

interface CreateResMatrixOptions {
  readonly connector: ResComposerConnector;
  readonly meta: ResMatrixMeta;
  readonly head: AnyResPlugHead;
  readonly cursor: unknown | CursorFactory;
  readonly userFactory: (plugin: unknown, cursor: never) => unknown | Promise<unknown>;
  readonly augmentCtx?: PluginCtxAugmenter;
  readonly postProcess?: (raw: unknown, cursor: never) => unknown;
}

const defaultBuildCtx: PluginCtxAugmenter = ($) => $;

export function createResMatrix(options: CreateResMatrixOptions): AnyResMatrix {
  const { connector, meta, head, cursor, userFactory, augmentCtx, postProcess } = options;

  const plug = createPlug(head);

  setPlugResolve(plug, async (locale: AnyLocale | undefined, chain: readonly AnyNamespace[]) => {
    const buildCtx2: PluginCtxAugmenter = ($) => {
      if (meta.family === "shell") {
        $.locale = locale;
      }
      $.ports = head.ports;
      return augmentCtx !== undefined ? augmentCtx($) : defaultBuildCtx($);
    };
    const wire = await connector.getWire(head.nsDeps, locale, buildCtx2, chain);
    return wire.plugin as never;
  });

  const create = async (locale: AnyLocale | undefined, chain: readonly AnyNamespace[]): Promise<AnyRes> => {
    const plugin = await getPlugResolve(plug)(locale, chain);
    // selfNs is the last entry of the chain (the namespace currently being
    // resolved). Passed to the cursor factory so namespace-aware cursors
    // (e.g., OuterGear's stateful cursor) can tag the actions/relays they
    // build with the OG's own namespace — needed by the relay ordering
    // provider to compute depth(relay) relative to mutation sources.
    const selfNs = chain.length > 0 ? chain[chain.length - 1] : undefined;
    const resolvedCursor = typeof cursor === "function" ? (cursor as CursorFactory)(plugin, selfNs) : cursor;
    const raw = await userFactory(plugin, resolvedCursor as never);
    return (postProcess ? postProcess(raw, resolvedCursor as never) : raw) as AnyRes;
  };

  return {
    [resMatrixMetaSymbol]: meta,
    create: create as () => Promise<AnyRes>,
    plug,
  };
}
