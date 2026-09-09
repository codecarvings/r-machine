/**
 * Copyright (c) 2026 Sergio Turolla and R-Machine contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { RequestScope, RequestScopeProvider } from "r-machine/core";

// Override-based scope provider. The active scope is set explicitly by the
// React adapter (`useBareReactPlug`) immediately before invoking the wire's
// plugin resolution, and reset right after — all within a synchronous block.
// RM's `slotsForLayout` runs synchronously inside that block and captures
// the request's `outerSlots` map into the resolution promise's closure.
//
// Why this works across server-component and client-component SSR (where
// AsyncLocalStorage and React.cache don't propagate): the scope is plumbed
// through React Context (set at the NextClientRMachine boundary, read in
// `useBareReactPlug`), and Context propagation is a fundamental property of
// React's render — it crosses any server/client SSR seam by design.
//
// Why this is concurrency-safe: JS is single-threaded, so two requests'
// renders never interleave at the JS-sync level. The set → use → reset
// window in `useBareReactPlug` is uninterruptable by other requests' code.
// After the sync window the resolution promise carries its captured
// `slotsMap` through any subsequent awaits, immune to further override
// mutations.

let override: RequestScope | null = null;

export const nextRequestScopeProvider: RequestScopeProvider = {
  getActiveScope: () => override,
  setOverride: (scope) => {
    override = scope;
  },
};
