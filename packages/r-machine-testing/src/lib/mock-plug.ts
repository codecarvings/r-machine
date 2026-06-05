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

import {
  type AnyListPlugHead,
  type AnyMapPlugHead,
  type AnyNamespace,
  type AnyPlugHead,
  type DeepPartial,
  type ExtractCtx,
  type ExtractKit,
  type ExtractResAtlas,
  getPlugMachine,
  getPlugResolve,
  type PlugBody,
  type PlugResolve,
  setPlugResolve,
} from "r-machine/core";
import { RMachineUsageError } from "r-machine/errors";
import type { AnyLocale } from "r-machine/locale";
import { ERR_PLUG_ALREADY_MOCKED } from "#r-machine/testing/errors";
import { cloneListPlugin, cloneMapPlugin, hasOverrides } from "./mock-merge.js";
import type { MockSurfaceMap } from "./mock-surface.js";

const plugMockSymbol = Symbol("plugMock");

type ResetPlug = () => void;

// Active resets across all mock plugs / test-mode entries, so `resetMockPlugs()`
// can drain a test that forgot its own reset (a leaked test-mode refcount would
// otherwise poison the next test's epoch transition).
const activeResets = new Set<ResetPlug>();

// Enter the plug's owning machine into test mode and return an idempotent reset
// that, on the LAST exit for that machine (refcount→0), wipes its resolved
// resource state for isolation. `restore` undoes a plug-resolve override (used
// by `.with(...)`); omitted by `.passthrough()` which seeds nothing.
function enterAndBuildReset(plug: PlugBody<AnyPlugHead>, restore?: () => void): ResetPlug {
  const machine = getPlugMachine(plug);
  machine?.testMode.enter();
  let done = false;
  const reset: ResetPlug = () => {
    if (done) {
      return;
    }
    done = true;
    activeResets.delete(reset);
    restore?.();
    machine?.testMode.exit();
    if (machine && !machine.testMode.isEnabled) {
      machine.disposeResources();
    }
  };
  activeResets.add(reset);
  return reset;
}

/**
 * Force every still-active mock plug / test-mode entry to reset. Intended for a
 * global `afterEach(resetMockPlugs)` safety net so one test's leaked mock can't
 * bleed into the next.
 */
export function resetMockPlugs(): void {
  for (const reset of [...activeResets]) {
    reset();
  }
}

interface MapMockPlug<PH extends AnyMapPlugHead> {
  readonly with: (data: MockPlugMapData<PH>) => ResetPlug;
  // Enter test mode for this plug's machine WITHOUT seeding it — the escape
  // hatch for tests that render against real defaults (a server component using
  // its default locale, a client component without a provider). The resolve
  // passes through to production unchanged.
  readonly passthrough: () => ResetPlug;
}

interface ListMockPlug<PH extends AnyListPlugHead> {
  readonly with: (data: MockPlugListData<PH>) => ResetPlug;
  readonly passthrough: () => ResetPlug;
}

interface MockPlug {
  <PH extends AnyMapPlugHead>(plug: PlugBody<PH>): MapMockPlug<PH>;
  <PH extends AnyListPlugHead>(plug: PlugBody<PH>): ListMockPlug<PH>;
}

export const mockPlug: MockPlug = (plug: PlugBody<AnyPlugHead>) => {
  return {
    with: (data: MockPlugMapData<AnyMapPlugHead> | MockPlugListData<AnyListPlugHead>) => {
      const prevResolve = getPlugResolve(plug);
      if ((prevResolve as any)[plugMockSymbol]) {
        throw new RMachineUsageError(ERR_PLUG_ALREADY_MOCKED, "Plug is already mocked.");
      }

      const overrides = data as Record<string, unknown>;

      const resolve: PlugResolve<AnyPlugHead> = async (
        locale: AnyLocale | undefined,
        chain: readonly AnyNamespace[]
      ) => {
        // A `$.locale` override is applied by re-resolving in the effective
        // locale: shells (and locale-aware deps) resolve their content BY the
        // locale threaded into `prevResolve`, so patching `$.locale` on the
        // result alone would not change resolved content.
        const ctx = overrides.$ as { locale?: AnyLocale } | undefined;
        const effLocale = ctx?.locale ?? locale;
        const plugin = await prevResolve(effLocale, chain);
        if (!hasOverrides(overrides)) {
          return plugin;
        }
        return (
          Array.isArray(plugin) ? cloneListPlugin(plugin, overrides) : cloneMapPlugin(plugin as object, overrides)
        ) as never;
      };
      (resolve as any)[plugMockSymbol] = true;

      setPlugResolve(plug, resolve);
      // enter() AFTER the double-mock guard + setPlugResolve, so a rejected
      // mock never bumps the machine's test-mode refcount.
      return enterAndBuildReset(plug, () => setPlugResolve(plug, prevResolve));
    },
    passthrough: () => enterAndBuildReset(plug),
  };
};

type MockPlugMapDataDeps<PH extends AnyMapPlugHead> = MockSurfaceMap<ExtractResAtlas<PH>, Omit<PH["deps"], "$">>;

type TupleToObject<T extends readonly unknown[]> = {
  [K in keyof T as K extends `${number}` ? K : never]: T[K];
};

type MockPlugListDeps<PH extends AnyListPlugHead> = MockSurfaceMap<
  ExtractResAtlas<PH>,
  Omit<TupleToObject<PH["deps"] extends readonly unknown[] ? PH["deps"] : never>, "$">
>;

type MockCtxContent<PH extends AnyPlugHead, C> = {
  [K in keyof C]?: K extends "kit"
    ? MockSurfaceMap<ExtractResAtlas<PH>, ExtractKit<PH>>
    : K extends "ports"
      ? Partial<C[K]>
      : // `$.state` is applied as a deep-partial over the current state at
        // runtime (untouched keys survive); the type mirrors that. For `$.locale`
        // (a string) DeepPartial is the identity.
        DeepPartial<C[K]>;
};

type MockCtx<PH extends AnyPlugHead> = keyof ExtractCtx<PH> extends never
  ? Record<string, never>
  : MockCtxContent<PH, ExtractCtx<PH>>;

type MockPlugMapData<PH extends AnyMapPlugHead> = { $?: MockCtx<PH> } & MockPlugMapDataDeps<PH>;

type MockPlugListData<PH extends AnyListPlugHead> = { $?: MockCtx<PH> } & MockPlugListDeps<PH>;
