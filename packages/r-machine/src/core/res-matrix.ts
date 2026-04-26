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
import type { GearRole } from "./gear.js";
import { createPlug, getPlugResolve, setPlugResolve } from "./plug.js";
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

type ResMatrixMeta = GearMatrixMeta | ShellMatrixMeta;

const resMatrixMetaSymbol: unique symbol = Symbol("resMatrixMeta");
// Cannot use ResMatrix<R extends AnyRes, ...> because of res tags
export interface ResMatrix<R, P extends AnyResPlug> {
  readonly [resMatrixMetaSymbol]: ResMatrixMeta;
  readonly factory: () => Promise<R>;
  readonly plug: P;
}

export type AnyResMatrix = ResMatrix<any, any>;

export function tryGetResMatrixMeta(origin: AnyResOrigin): ResMatrixMeta | undefined {
  return (origin as Partial<AnyResMatrix>)[resMatrixMetaSymbol];
}

interface CreateResMatrixOptions {
  readonly connector: ResComposerConnector;
  readonly meta: ResMatrixMeta;
  readonly head: AnyResPlugHead;
  readonly cursor: unknown;
  readonly userFactory: (plugin: unknown, cursor: never) => unknown | Promise<unknown>;
  readonly buildPlugin?: (resolved: unknown, locale: AnyLocale | undefined) => unknown;
  readonly postProcess?: (raw: unknown, cursor: never) => unknown;
}

export function createResMatrix(options: CreateResMatrixOptions): AnyResMatrix {
  const { connector, meta, head, cursor, userFactory, buildPlugin, postProcess } = options;

  const plug = createPlug(head);

  setPlugResolve(plug, async (locale: AnyLocale | undefined, selfNamespace: AnyNamespace | undefined) => {
    const wire = await connector.getWire(head.nsDeps, locale, selfNamespace);
    const plugin = wire.plugin;
    return (buildPlugin ? buildPlugin(plugin, locale) : plugin) as never;
  });

  const factory = async (locale: AnyLocale | undefined, selfNamespace: AnyNamespace): Promise<AnyRes> => {
    const plugin = await getPlugResolve(plug)(locale, selfNamespace);
    const raw = await userFactory(plugin, cursor as never);
    return (postProcess ? postProcess(raw, cursor as never) : raw) as AnyRes;
  };

  return {
    [resMatrixMetaSymbol]: meta,
    factory: factory as () => Promise<AnyRes>,
    plug,
  };
}
