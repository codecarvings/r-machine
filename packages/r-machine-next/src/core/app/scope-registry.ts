/**
 * Copyright (c) 2026 Sergio Turolla and R-Machine contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { RequestScope } from "r-machine/core";

// Process-wide registry mapping scopeId → RequestScope. Lives on `globalThis`
// so that all Node-side bundle contexts (server components, client component
// SSR pass, middleware/proxy) share a single Map regardless of how many times
// this module file is evaluated by Turbopack. The browser runtime has a
// distinct `globalThis`, so the client-side Map is naturally empty — which is
// the correct behavior (no request lifecycle in the browser; RM falls back to
// process-tier slots).
//
// Why this exists at all: server components can only pass *serializable* props
// to client components, so we can't hand a `RequestScope` (with its Maps)
// across the boundary directly. Instead the server side generates a UUID
// `scopeId`, stores the scope under that id here, and passes the id (a plain
// string) as a prop to the client component. The client component (server-
// SSR'd in the same Node process) looks the scope back up via `lookupScope`.

const REGISTRY_KEY = Symbol.for("@r-machine/next/request-scope-registry");
type GlobalSlot = { [REGISTRY_KEY]?: Map<string, RequestScope> };

function getRegistry(): Map<string, RequestScope> {
  const g = globalThis as GlobalSlot;
  if (!g[REGISTRY_KEY]) {
    g[REGISTRY_KEY] = new Map<string, RequestScope>();
  }
  return g[REGISTRY_KEY]!;
}

export function registerScope(id: string, scope: RequestScope): void {
  getRegistry().set(id, scope);
}

export function lookupScope(id: string): RequestScope | null {
  return getRegistry().get(id) ?? null;
}

export function unregisterScope(id: string): void {
  getRegistry().delete(id);
}
