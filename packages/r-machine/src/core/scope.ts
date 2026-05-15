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

import type { Juncture } from "./juncture.js";
import type { AnyNamespace } from "./res-domain.js";

// A JM cache slot. Lifetime depends on which tier owns it: process-shared
// (JunctureManager.slots) for Base/Inner/Shell, or request-scoped
// (RequestScope.outerSlots / vertexSlots) for OuterGear instances.
export interface Slot {
  readonly key: string;
  readonly namespace: AnyNamespace;
  readonly generation: number;
  content: Juncture | Promise<Juncture>;
}

// State that lives for the duration of a single render context (e.g. an HTTP
// request on the server, where the Outer tier must be isolated per request).
// The wireCache piece is opaque to core (Map<string, unknown>) — the React
// adapter knows the concrete WireEntry shape and casts internally.
export interface RequestScope {
  readonly outerSlots: Map<string, Slot>;
  readonly vertexSlots: Map<string, Slot>;
  readonly vertexSlotsByGenId: Map<number, Set<AnyNamespace>>;
  readonly wireCachesByPlugId: Map<symbol, Map<string, unknown>>;
}

// Abstraction over "where to find the active request scope". Implementations
// live in adapter packages (e.g. `@r-machine/next` uses a sync override pushed
// from the React adapter); core stays free of runtime-specific primitives.
// When no scope is active (client browser, raw Node script, tests), the
// provider returns null and the JM falls back to its process-shared maps.
//
// `setOverride` is the propagation channel for environments where async-
// context-based propagation (AsyncLocalStorage, React.cache) doesn't survive
// the boundary between server-component render and client-component SSR
// (e.g. Next 16 / React 19 App Router). The adapter's React layer reads the
// active scope from a React Context (set by the server boundary component),
// then calls `setOverride(scope)` synchronously immediately before invoking
// the wire's plugin resolution, and `setOverride(null)` immediately after.
// JM's `slotsForLayout` runs synchronously inside that window and captures
// the request's `outerSlots` map into the resolution promise's closure —
// after which the override is irrelevant for the rest of the (async)
// resolution. Concurrent requests on the same Node process never interleave
// at the JS sync level, so the sync set/use/reset window is safe.
export interface RequestScopeProvider {
  getActiveScope(): RequestScope | null;
  // Optional: implementations that don't support sync override (e.g. the
  // PROCESS_SCOPE_PROVIDER no-op) omit this and the React adapter falls back
  // to consulting `getActiveScope()` directly.
  setOverride?(scope: RequestScope | null): void;
}

export const PROCESS_SCOPE_PROVIDER: RequestScopeProvider = {
  getActiveScope: () => null,
};

export function createRequestScope(): RequestScope {
  return {
    outerSlots: new Map(),
    vertexSlots: new Map(),
    vertexSlotsByGenId: new Map(),
    wireCachesByPlugId: new Map(),
  };
}
