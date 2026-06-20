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
  getPlugHead,
  getPlugMachine,
  getPlugOverride,
  getPlugResolve,
  type PlugBody,
  type PlugResolve,
  setPlugOverride,
  setPlugResolve,
} from "r-machine/core";
import { RMachineUsageError } from "r-machine/errors";
import type { AnyLocale } from "r-machine/locale";
import { ERR_PLUG_ALREADY_MOCKED } from "#r-machine/testing/errors";
import { createStateBinding, type MockListController, type MockMapController } from "./mock-controller.js";
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
// by `.with(...)`); omitted by `.default()` which seeds nothing.
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
  // Resolve WITH overrides (locale key / ports / kit / dep-surface members) + the
  // controller to drive state.
  readonly with: (data: MockPlugMapData<PH>) => MockMapController<PH>;
  // Resolve against the real DEFAULTS (no override) + the controller. Exactly
  // `with({})`: the escape hatch for tests that render real production output (a
  // server component at its default locale, a client component without a
  // provider) while still seeding/observing state through the controller — or,
  // when only test mode is needed, `const { reset } = mockPlug(p).default()`.
  readonly default: () => MockMapController<PH>;
}

interface ListMockPlug<PH extends AnyListPlugHead> {
  readonly with: (data: MockPlugListData<PH>) => MockListController<PH>;
  readonly default: () => MockListController<PH>;
}

interface MockPlug {
  <PH extends AnyMapPlugHead>(plug: PlugBody<PH>): MapMockPlug<PH>;
  <PH extends AnyListPlugHead>(plug: PlugBody<PH>): ListMockPlug<PH>;
}

export const mockPlug: MockPlug = (plug: PlugBody<AnyPlugHead>) => {
  const withData = (data: MockPlugMapData<AnyMapPlugHead> | MockPlugListData<AnyListPlugHead>) => {
    const overrides = data as Record<string, unknown>;
    // The locale override re-resolves in the effective locale: shells (and
    // locale-aware deps) resolve their content BY locale, so patching the
    // locale on the result alone would not change resolved content. The key is
    // named by plug kind (`$.locale` on a resource plug, `$.ambientLocale` on an
    // ambient consumer — see `MockCtxContent`); at runtime only one is ever set,
    // so read both.
    const ctxOverride = overrides.$ as { locale?: AnyLocale; ambientLocale?: AnyLocale } | undefined;
    const localeOverride = ctxOverride?.ambientLocale ?? ctxOverride?.locale;
    // Per-call state binding: the transform binds the controller's cells from
    // each resolved plugin; the controller's handles read/write through it.
    const binding = createStateBinding(plug);
    // Shared post-resolution rewrite, reused by both plug kinds: ALWAYS bind the
    // controller cells; clone only when there is a surface/ctx override (so
    // `default()` = `with({})` is a pure bind that returns the plugin unchanged).
    const transform = (plugin: unknown): unknown => {
      binding.bind(plugin);
      if (!hasOverrides(overrides)) {
        return plugin;
      }
      return Array.isArray(plugin) ? cloneListPlugin(plugin, overrides) : cloneMapPlugin(plugin as object, overrides);
    };

    // B — CONSUMER plug (`realm: "gate"`): its own resolve is never invoked
    // at consume time (deps resolve by namespace via getWire/getGatePlugin),
    // so register a post-resolution override that core applies there.
    if (getPlugHead(plug).realm === "gate") {
      if (getPlugOverride(plug) !== undefined) {
        throw new RMachineUsageError(ERR_PLUG_ALREADY_MOCKED, "Plug is already mocked.");
      }
      setPlugOverride(plug, { ambientLocale: localeOverride, transform });
      // enter() AFTER the double-mock guard so a rejected mock never bumps
      // the machine's test-mode refcount.
      const reset = enterAndBuildReset(plug, () => {
        setPlugOverride(plug, undefined);
        binding.clear();
      });
      return binding.makeController(reset) as never;
    }

    // A — RESOURCE plug: wrap its resolve, which IS invoked during
    // by-namespace resolution (res-matrix.ts).
    const prevResolve = getPlugResolve(plug);
    if ((prevResolve as any)[plugMockSymbol]) {
      throw new RMachineUsageError(ERR_PLUG_ALREADY_MOCKED, "Plug is already mocked.");
    }
    const resolve: PlugResolve<AnyPlugHead> = async (locale: AnyLocale | undefined, chain: readonly AnyNamespace[]) => {
      const plugin = await prevResolve(localeOverride ?? locale, chain);
      return transform(plugin) as never;
    };
    (resolve as any)[plugMockSymbol] = true;
    setPlugResolve(plug, resolve);
    const reset = enterAndBuildReset(plug, () => {
      setPlugResolve(plug, prevResolve);
      binding.clear();
    });
    return binding.makeController(reset) as never;
  };

  return {
    with: withData,
    default: () => withData({} as never),
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

// `$.state` and `$.defaultState` are intentionally NOT overridable here: live
// state is driven by the returned controller (`ctrl.state` / `ctrl.deps.X.state`),
// the single, typed, reactive way to set it. `.with(...)` covers RESOLUTION
// inputs only (the locale key, `$.ports`, `$.kit`). (`$.defaultState` was already
// a runtime no-op.)
//
// The locale key is named by plug kind, because the override means three
// different things (and the name must not lie):
//   - RESOURCE plug (`realm: "res"`, e.g. a shell): `$.locale` — "resolve this
//     resource AT this locale"; the override WINS. Kept as `locale`.
//   - AMBIENT CONSUMER (`realm: "gate"` WITH `setLocale` — Plug / ClientPlug /
//     ServerPlug): `$.ambientLocale` — the locale the absent ambient container
//     (React context / request header) would have supplied; a FALLBACK that
//     loses to an explicitly-passed locale.
//   - DirectPlug (`realm: "gate"`, NO `setLocale`): no ambient container at all,
//     so the key is DROPPED — overriding it is a compile error (a shell resource
//     plug and a DirectPlug share the same ctx, so `realm` is the discriminant).
type MockCtxContent<PH extends AnyPlugHead, C> = {
  [K in keyof C as K extends "state" | "defaultState"
    ? never
    : K extends "locale"
      ? PH["realm"] extends "gate"
        ? "setLocale" extends keyof C
          ? "ambientLocale" // ambient consumer → rename
          : never // DirectPlug → drop
        : K // resource plug → keep `locale`
      : K]?: K extends "kit"
    ? MockSurfaceMap<ExtractResAtlas<PH>, ExtractKit<PH>>
    : K extends "ports"
      ? Partial<C[K]>
      : // e.g. the locale key (a string) — DeepPartial is the identity.
        DeepPartial<C[K]>;
};

// Guard on the REMAPPED content, not the raw ctx: when nothing remains
// overridable (e.g. a non-kitted DirectPlug, whose only ctx member `locale` is
// dropped), fall back to `Record<string, never>` so `$` REJECTS every property.
// An empty `{}` would instead be permissive (TS does not excess-check against
// `{}`), silently re-allowing the forbidden locale keys.
type MockCtx<PH extends AnyPlugHead> = keyof MockCtxContent<PH, ExtractCtx<PH>> extends never
  ? Record<string, never>
  : MockCtxContent<PH, ExtractCtx<PH>>;

type MockPlugMapData<PH extends AnyMapPlugHead> = { $?: MockCtx<PH> } & MockPlugMapDataDeps<PH>;

type MockPlugListData<PH extends AnyListPlugHead> = { $?: MockCtx<PH> } & MockPlugListDeps<PH>;
