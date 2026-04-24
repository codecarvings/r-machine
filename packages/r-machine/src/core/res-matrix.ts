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
import { createPlug, type ExtractPlugin, getPlugResolve, type PlugBody, setPlugResolve } from "./plug.js";
import type { AnyRes, AnyResOrigin, ResFamily } from "./res.js";
import type { ResComposerConnector } from "./res-composer-connector.js";
import type { AnyNamespace } from "./res-domain.js";
import type { AnyResPlug, AnyResPlugHead } from "./res-plug.js";

export interface ResMatrixMeta {
  readonly family: ResFamily;
  readonly isReactive: boolean;
}

const resMatrixMetaSymbol: unique symbol = Symbol("resMatrixMeta");
// Cannot use ResMatrix<R extends AnyRes, ...> because of res tags
export interface ResMatrix<R, P extends AnyResPlug> {
  readonly [resMatrixMetaSymbol]: ResMatrixMeta;
  readonly factory: () => Promise<R>;
  readonly plug: P;
}

export type AnyResMatrix = ResMatrix<any, any>;

export function createResMatrix<R extends AnyRes, P extends AnyResPlug>(
  meta: ResMatrixMeta,
  factory: () => Promise<R>,
  plug: P
): ResMatrix<R, P> {
  return {
    [resMatrixMetaSymbol]: meta,
    factory,
    plug,
  };
}

export function tryGetResMatrixMeta(origin: AnyResOrigin): ResMatrixMeta | undefined {
  return (origin as Partial<AnyResMatrix>)[resMatrixMetaSymbol];
}

// #region Assemble ResMatrix

export type BuildResPlugin<H extends AnyResPlugHead> = (
  resolved: ExtractPlugin<H>,
  locale: AnyLocale | undefined
) => ExtractPlugin<H>;

interface AssembleResMatrixOptions<PH extends AnyResPlugHead, RAW, RES extends AnyRes> {
  readonly connector: ResComposerConnector;
  readonly meta: ResMatrixMeta;
  readonly head: PH;
  readonly cursor: unknown;
  readonly userFactory: (plugin: ExtractPlugin<PH>, cursor: never) => RAW | Promise<RAW>;
  readonly buildPlugin?: BuildResPlugin<PH>;
  readonly postProcess?: (raw: RAW, cursor: never) => RES;
}

export function assembleResMatrix<PH extends AnyResPlugHead, RAW, RES extends AnyRes>(
  options: AssembleResMatrixOptions<PH, RAW, RES>
): ResMatrix<RES, PlugBody<PH>> {
  const { connector, meta, head, cursor, userFactory, buildPlugin, postProcess } = options;

  const plug = createPlug(head);

  setPlugResolve(plug, async (locale: AnyLocale | undefined, selfNamespace: AnyNamespace | undefined) => {
    const wire = await connector.getResWire(head.nsDeps, locale, selfNamespace);
    const plugin = wire.plugin as ExtractPlugin<PH>;
    return buildPlugin ? buildPlugin(plugin, locale) : plugin;
  });

  const factory = async (locale: AnyLocale | undefined, selfNamespace: AnyNamespace): Promise<RES> => {
    const plugin = await getPlugResolve(plug)(locale, selfNamespace);
    const raw = await userFactory(plugin, cursor as never);
    return postProcess ? postProcess(raw, cursor as never) : (raw as unknown as RES);
  };

  return createResMatrix<RES, PlugBody<PH>>(meta, factory as () => Promise<RES>, plug);
}

// #endregion
