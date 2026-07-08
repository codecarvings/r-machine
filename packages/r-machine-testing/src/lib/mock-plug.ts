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
  type AnyResMatrix,
  type AnyResPlug,
  type DeepPartial,
  type ExtractCtx,
  type ExtractKit,
  type ExtractResAtlas,
  getPlugHead,
  getPlugMachine,
  getPlugOverride,
  getPlugResolve,
  instantiateRes,
  type PlugBody,
  type PlugResolve,
  type ResMatrix,
  setPlugOverride,
  setPlugResolve,
  tryGetResMatrixMeta,
} from "r-machine/core";
import { RMachineUsageError } from "r-machine/errors";
import type { AnyLocale } from "r-machine/locale";
import { ERR_MOCK_TARGET_INVALID, ERR_PLUG_ALREADY_MOCKED } from "#r-machine/testing/errors";
import { createStateBinding, type MockListController, type MockMapController } from "./mock-controller.js";
import { cloneListPlugin, cloneMapPlugin, hasOverrides } from "./mock-merge.js";
import type { MockSurfaceMap } from "./mock-surface.js";
import { buildTestSurface, type TestSurface } from "./test-surface.js";

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

// `createRes()` instantiates the mocked resource (overrides applied) and returns
// its `TestSurface` — the assert-side twin of the dep-mock surface. Present ONLY
// when a `ResMatrix` is passed to `mockPlug` (gear/shell): a bare plug can't
// instantiate (the factory/cursor live in the matrix closure), and a consumer
// isn't a resource — so the method's absence is self-explanatory. The controller
// auto-disposes each instance it created on reset (dispose is idempotent, so it
// is safe even if the test also disposed it), so a `using ctrl` alone tears down
// the instance too.
interface MockRes<R> {
  readonly createRes: () => Promise<TestSurface<R>>;
}

interface MapMockPlugWithRes<R, PH extends AnyMapPlugHead> {
  readonly with: (data: MockPlugMapData<PH>) => MockMapController<PH> & MockRes<R>;
  readonly default: () => MockMapController<PH> & MockRes<R>;
}

interface ListMockPlugWithRes<R, PH extends AnyListPlugHead> {
  readonly with: (data: MockPlugListData<PH>) => MockListController<PH> & MockRes<R>;
  readonly default: () => MockListController<PH> & MockRes<R>;
}

// A plug is exposed either bare, or attached to a CARRIER: the consumer function
// it powers (`Comp.plug`, the function that calls `plug.useR()`) or a `ResMatrix`
// (`r.plug`). `mockPlug` accepts both — the carrier is the symbol a test naturally
// reaches for, and avoids a wall of identically-named `plug` exports.
type PlugCarrier<PH extends AnyPlugHead> = { readonly plug: PlugBody<PH> };
type MockPlugTarget<PH extends AnyPlugHead> = PlugBody<PH> | PlugCarrier<PH>;

interface MockPlug {
  // ResMatrix (gear/shell) — the controller gains `createRes()`. Listed FIRST so
  // it wins over the generic carrier overloads below (a `ResMatrix` also matches
  // `PlugCarrier` via its `.plug`). `R` is captured for `TestSurface<R>`; the head
  // is inferred from the matrix's own plug (a res head, which satisfies
  // `AnyResPlug`), then dispatched to the map/list controller.
  <R, P extends AnyResPlug>(
    target: ResMatrix<R, P>
  ): P extends PlugBody<infer PH>
    ? PH extends AnyMapPlugHead
      ? MapMockPlugWithRes<R, PH>
      : PH extends AnyListPlugHead
        ? ListMockPlugWithRes<R, PH>
        : never
    : never;
  // Bare plug or consumer carrier — no `createRes` (not instantiable / not a resource).
  <PH extends AnyMapPlugHead>(target: MockPlugTarget<PH>): MapMockPlug<PH>;
  <PH extends AnyListPlugHead>(target: MockPlugTarget<PH>): ListMockPlug<PH>;
}

export const mockPlug: MockPlug = (target: MockPlugTarget<AnyPlugHead>) => {
  // Normalize carrier → plug: `getPlugHead` reads the head symbol, defined only on
  // a real plug (undefined on a consumer function or a `ResMatrix`), so it both
  // discriminates the two inputs and validates the `.plug` we unwrap.
  const headSym = (t: unknown): AnyPlugHead | undefined =>
    t == null ? undefined : getPlugHead(t as PlugBody<AnyPlugHead>);
  const resolved =
    headSym(target) !== undefined
      ? (target as PlugBody<AnyPlugHead>)
      : (target as PlugCarrier<AnyPlugHead> | null)?.plug;
  if (resolved == null || headSym(resolved) === undefined) {
    throw new RMachineUsageError(
      ERR_MOCK_TARGET_INVALID,
      "mockPlug() expects a plug or a carrier exposing `.plug` (a consumer function or a resource)."
    );
  }
  const plug: PlugBody<AnyPlugHead> = resolved;

  // When the target is a ResMatrix (gear/shell), capture it so the controller
  // can expose `createRes()`. `instantiateRes(matrix)` runs through the
  // mock-wrapped resolve (overrides applied); `buildTestSurface` reshapes the
  // res's getters into properties. A bare plug / consumer carrier has no matrix
  // → no method.
  const resMatrix =
    tryGetResMatrixMeta(target as never) !== undefined ? (target as unknown as AnyResMatrix) : undefined;

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

    // Test instances produced by `createRes()`, tracked so the controller
    // auto-disposes them on reset. A `createRes` instance is engine-untracked
    // (instantiated directly, not a resolved slot), so without this a forgotten
    // teardown (e.g. a `setInterval`, a relay subscription) would leak across
    // tests. Dispose is idempotent (guaranteed by `createResMatrix`), so calling
    // it here is safe even when the test already disposed the instance itself.
    const created: Array<{ [Symbol.dispose]?: () => void }> = [];
    const disposeCreated = (): void => {
      for (const surface of created) {
        surface[Symbol.dispose]?.();
      }
      created.length = 0;
    };

    // Build the controller and, for a ResMatrix target, graft `createRes()`.
    const finish = (reset: ResetPlug): Record<string, unknown> => {
      const ctrl = binding.makeController(reset);
      if (resMatrix !== undefined) {
        ctrl.createRes = async () => {
          const surface = buildTestSurface((await instantiateRes(resMatrix)) as object);
          if (typeof (surface as { [Symbol.dispose]?: unknown })[Symbol.dispose] === "function") {
            created.push(surface as { [Symbol.dispose]?: () => void });
          }
          return surface;
        };
      }
      return ctrl;
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
      return finish(reset) as never;
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
      // Dispose the test instances the controller created (unless the test
      // already did) BEFORE restoring the resolve / wiping machine state.
      disposeCreated();
      setPlugResolve(plug, prevResolve);
      binding.clear();
    });
    return finish(reset) as never;
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
      ? // ports are deep-merged over the real ports object (mergeLiveOverride).
        DeepPartial<C[K]>
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
