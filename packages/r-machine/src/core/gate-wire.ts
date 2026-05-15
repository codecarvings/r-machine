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
import type { AnyNamespaceCollection } from "./res-domain.js";
import type { VertexGearMap } from "./vertex-gear.js";

/*
function useGate(wire: GateWire): unknown {
  const pluginPromise = useSyncExternalStore(
    wire.subscribe,
    wire.getPluginPromise,  // snapshot = Promise reference
    wire.getPluginPromise,  // SSR snapshot
  );

  const plugin = use(pluginPromise);

  useEffect(() => {
    wire.commitTracking();
  });

  return plugin;
}

--- IMPORANTE:
getPluginPromise() deve ritornare esattamente la stessa reference fra due chiamate se non è arrivata una notify.
La promessa va sostituita solo dentro a una notify
*/

export type GateWireProvider = (
  nsDeps: AnyNamespaceCollection,
  locale: AnyLocale,
  vertexGearMap?: VertexGearMap | undefined
) => GateWire;

export interface GateWire {
  readonly getPluginPromise: () => Promise<unknown>;
  readonly subscribe: (callback: () => void) => () => void;
  // Open a tracking cassette + return a commit fn. The consumer-supplied
  // `notify` callback is fired whenever a tracked dep mutates AFTER commit
  // — this is a separate channel from `subscribe` (which carries JM-driven
  // plugin re-resolves and busts the Promise identity). Cassette changes do
  // NOT touch the Promise, so `useSyncExternalStore`-bound consumers stay
  // stable; the consumer drives its own re-render via this notify (typically
  // a `useReducer`-style forceRerender).
  readonly startTracking: (notify: () => void) => () => void;
  readonly updateRequest: (locale: AnyLocale, vertexGearMap?: VertexGearMap | undefined) => void;
}
