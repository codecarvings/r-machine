/**
 * Copyright (c) 2026 Sergio Turolla
 *
 * This file is part of @r-machine/react, licensed under the
 * GNU Affero General Public License v3.0 (AGPL-3.0-only).
 *
 * You may use, modify, and distribute this file under the terms
 * of the AGPL-3.0. See LICENSE in this package for details.
 *
 * If you need to use this software in a proprietary project,
 * contact: licensing@codecarvings.com
 */

"use client";

import type { RequestScope } from "r-machine/core";
import { createContext } from "react";

// React Context used by adapter layers (e.g. @r-machine/next) to propagate
// the active request's scope from a boundary component to every consumer
// of `useBareReactPlug` in the same React tree — including SSR of client
// components, which is the case async-context primitives (AsyncLocalStorage,
// React.cache) fail to bridge in modern RSC pipelines.
//
// The Provider is set by the adapter; the consumer (`useBareReactPlug`)
// reads via `useContext` and, when a scope is present, calls the rMachine's
// scope-provider `setOverride(scope)` synchronously around its wire
// resolution call so RM's `slotsForLayout` captures the request-scoped
// `outerSlots` map.
//
// When no Provider is set (client browser, plain React app, tests), the
// context returns null and the wire layer skips the override step — RM
// falls back to its process-tier slots map, which is the correct behavior
// outside a request lifecycle.
export const RequestScopeContext = createContext<RequestScope | null>(null);
