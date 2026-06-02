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

export type WireProvider = (
  nsDeps: AnyNamespaceCollection,
  locale: AnyLocale,
  vertexGearMap?: VertexGearMap | undefined
) => Wire;

export interface Wire {
  readonly getPluginPromise: () => Promise<unknown>;
  readonly subscribe: (callback: () => void) => () => void;
  // Open a tracking cassette for `consumerKey` + return a commit fn. The
  // consumer-supplied `notify` callback is fired whenever a tracked dep
  // mutates AFTER commit — this is a separate channel from `subscribe`
  // (which carries JM-driven plugin re-resolves and busts the Promise
  // identity). Cassette changes do NOT touch the Promise, so
  // `useSyncExternalStore`-bound consumers stay stable; the consumer drives
  // its own re-render via this notify (typically a `useReducer`-style
  // forceRerender).
  //
  // `consumerKey` is a stable opaque identity per consumer (e.g. a useRef-
  // held empty object). Wires are shared across consumers when they resolve
  // to the same (locale, vgmSig) cache key; the wire keeps per-consumer
  // cassette + epoch + subs lists so that one consumer's commit doesn't
  // tear down another's subscriptions, and a Suspense retry within one
  // consumer doesn't supersede another consumer's pending commit.
  readonly startTracking: (notify: () => void, consumerKey: object) => () => void;
  // Tear down all state (cassette, cell subs) for a single consumer. Called
  // by the consumer on unmount or when the wire identity changes (e.g.
  // locale switch). Wire-level teardown (on last-subscriber unsubscribe)
  // disposes ALL remaining consumers automatically.
  readonly disposeConsumer: (consumerKey: object) => void;
  readonly updateRequest: (locale: AnyLocale, vertexGearMap?: VertexGearMap | undefined) => void;
}
