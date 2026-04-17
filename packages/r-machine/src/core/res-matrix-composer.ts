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
import {
  createPlug,
  type ExtractPlugin,
  getPlugLocale,
  getPlugResolve,
  type PlugBody,
  setPlugResolve,
} from "./plug.js";
import type { AnyRes } from "./res.js";
import type { AnyResAtlas } from "./res-atlas.js";
import type { NamespaceList } from "./res-list.js";
import type { NamespaceMap } from "./res-map.js";
import { createResMatrix, type ResMatrix, type ResMatrixMeta } from "./res-matrix.js";
import type { AnyResPlugHead } from "./res-plug.js";
import type { ResWireProvider } from "./res-wire.js";

export type BuildPlugin<H extends AnyResPlugHead> = (
  resolved: ExtractPlugin<H>,
  locale: AnyLocale | undefined
) => ExtractPlugin<H>;

export interface ComposeResMatrixOptions<H extends AnyResPlugHead, RAW, RES extends AnyRes> {
  readonly provider: ResWireProvider;
  readonly meta: ResMatrixMeta;
  readonly head: H;
  readonly namespaces: NamespaceMap<AnyResAtlas> | NamespaceList<AnyResAtlas>;
  readonly cursor: unknown;
  readonly userFactory: (plugin: ExtractPlugin<H>, cursor: never) => RAW | Promise<RAW>;
  readonly buildPlugin?: BuildPlugin<H>;
  readonly postProcess?: (raw: RAW, cursor: never) => RES;
}

export function composeResMatrix<H extends AnyResPlugHead, RAW, RES extends AnyRes>(
  options: ComposeResMatrixOptions<H, RAW, RES>
): ResMatrix<RES, PlugBody<H>> {
  const { provider, meta, head, namespaces, cursor, userFactory, buildPlugin, postProcess } = options;

  const connector = provider(meta.family, namespaces);
  const plug = createPlug(head);

  setPlugResolve(plug, () => {
    const locale = getPlugLocale(plug) as AnyLocale | undefined;
    const wire = connector(locale);
    const resolved = wire.getPlugin() as ExtractPlugin<H>;
    return buildPlugin ? buildPlugin(resolved, locale) : resolved;
  });

  const factory = async (): Promise<RES> => {
    const plugin = getPlugResolve(plug)();
    const raw = await userFactory(plugin, cursor as never);
    return postProcess ? postProcess(raw, cursor as never) : (raw as unknown as RES);
  };

  return createResMatrix<RES, PlugBody<H>>(meta, factory, plug);
}
