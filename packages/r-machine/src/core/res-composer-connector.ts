/**
 * Copyright (c) 2026 Sergio Turolla
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AnyLocale } from "#r-machine/locale";
import type { PluginCtxAugmenter, PlugMachine } from "./plug.js";
import type { AnyNamespace, AnyNamespaceCollection } from "./res-domain.js";
import type { ASYNC } from "./sync-resolve.js";

export interface ResComposerConnector {
  readonly getWire: (
    nsDeps: AnyNamespaceCollection,
    locale: AnyLocale | undefined,
    augmentCtx: PluginCtxAugmenter,
    chain: readonly AnyNamespace[]
  ) => Promise<ResWire>;
  // Synchronous sibling of `getWire` (Tier B sync fast path). Resolves the
  // dependency plugin synchronously when every transitive dep is warm /
  // sync-eligible, otherwise returns the `ASYNC` sentinel. Optional: connectors
  // assembled outside an RMachine (bare composer unit tests) may omit it, in
  // which case the matrix's sync resolve always declines.
  readonly getWireSync?: (
    nsDeps: AnyNamespaceCollection,
    locale: AnyLocale | undefined,
    augmentCtx: PluginCtxAugmenter,
    chain: readonly AnyNamespace[]
  ) => ResWire | typeof ASYNC;
  // The owning RMachine's reset capability, stamped onto every Plug built
  // through this connector (see `createResMatrix`). Absent when a connector is
  // assembled outside an RMachine (bare composer unit tests).
  readonly machine?: PlugMachine;
  // Single-shot, non-subscribing resolve of a SHELL surface for a given locale
  // — backs the `res.perLocale(...)` dep loaders (`plugin.<alias>(locale)`). Creates
  // no persistent wire (like `getGatePlugin`). Optional: absent for connectors
  // assembled outside an RMachine (bare composer unit tests), in which case a
  // shell resolver dep resolves to a loader that throws if actually invoked.
  readonly resolveShell?: (shellNs: AnyNamespace, locale: AnyLocale) => Promise<unknown>;
}

export interface ResWire {
  readonly plugin: unknown;
}
