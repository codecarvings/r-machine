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
import type { GearRole } from "./gear-plug.js";
import {
  createPlug,
  getPlugResolve,
  getPlugResolveSync,
  type PluginCtxAugmenter,
  setPlugMachine,
  setPlugResolve,
  setPlugResolveSync,
} from "./plug.js";
import type { AnyRes, AnyResOrigin } from "./res.js";
import type { ResComposerConnector } from "./res-composer-connector.js";
import type { AnyNamespace } from "./res-domain.js";
import type { AnyResPlug, AnyResPlugHead } from "./res-plug.js";
import { ASYNC, isThenable } from "./sync-resolve.js";

export interface GearMatrixMeta {
  readonly family: "gear";
  readonly role: GearRole;
}

export interface ShellMatrixMeta {
  readonly family: "shell";
}

// Forces T (the inferred return type of a clone fn) to expose only keys that
// exist on R. Any extra key K in T is rewritten to `never`, so a literal that
// carries an unknown property fails to satisfy the constraint at the call
// site. Phase 1 of the clone API keeps the result shape locked to R; users
// who genuinely want to widen the resource should reach for a future,
// differently-named method instead of leaking extras through .clone().
export type NoExcess<R, T> = T & { [K in Exclude<keyof T, keyof R>]: never };

type ResMatrixMeta = GearMatrixMeta | ShellMatrixMeta;

const resMatrixMetaSymbol: unique symbol = Symbol("resMatrixMeta");

// Mutable eligibility holder for the Tier B sync fast path. Set by the async
// `create` the first time it observes the user factory returning synchronously
// (a non-thenable). `resolvePodSync` reads it via `isResMatrixSyncEligible` and
// only runs `createSync` (the factory, in render phase) when it is true — so an
// async factory's synchronous prefix is never executed speculatively.
const resMatrixSyncEligibleSymbol: unique symbol = Symbol("resMatrixSyncEligible");

// Cannot use ResMatrix<R extends AnyRes, ...> because of res tags.
// The base type carries only what's universally observable: identity (meta),
// resolution (`create`) and the plug. Derivation methods (`clone`, `withPorts`,
// `withState`) live on the specialized matrix types — each family knows
// what's meaningful to override, and the typing stays strict there.
export interface ResMatrix<R, P extends AnyResPlug> {
  readonly [resMatrixMetaSymbol]: ResMatrixMeta;
  readonly create: () => Promise<R>;
  // Synchronous sibling of `create` (Tier B). Runs the user factory in the
  // current tick, returning the resource or `ASYNC` when a dep can't be
  // resolved synchronously / the factory turns out async. Only invoked by
  // `resolvePodSync` once the matrix is sync-eligible.
  readonly createSync: () => R | typeof ASYNC;
  readonly plug: P;
  readonly [resMatrixSyncEligibleSymbol]: { eligible: boolean };
}

export type AnyResMatrix = ResMatrix<any, any>;

export function tryGetResMatrixMeta(origin: AnyResOrigin): ResMatrixMeta | undefined {
  return (origin as Partial<AnyResMatrix>)[resMatrixMetaSymbol];
}

// True when this origin is a matrix whose user factory has already proven
// synchronous on a prior async resolve (see `resMatrixSyncEligibleSymbol`).
export function isResMatrixSyncEligible(origin: AnyResOrigin): boolean {
  return (origin as Partial<AnyResMatrix>)[resMatrixSyncEligibleSymbol]?.eligible ?? false;
}

type CursorFactory = (plugin: unknown, selfNs?: AnyNamespace) => unknown;

interface CreateResMatrixOptions {
  readonly connector: ResComposerConnector;
  readonly meta: ResMatrixMeta;
  readonly head: AnyResPlugHead;
  readonly cursor: unknown | CursorFactory;
  readonly userFactory: (plugin: unknown, cursor: never) => unknown | Promise<unknown>;
  readonly augmentCtx?: PluginCtxAugmenter;
  readonly postProcess?: (raw: unknown, cursor: never) => unknown;
}

const defaultBuildCtx: PluginCtxAugmenter = ($) => $;

export function createResMatrix(options: CreateResMatrixOptions): AnyResMatrix {
  const { connector, meta, head, cursor, userFactory, augmentCtx, postProcess } = options;

  const plug = createPlug(head);
  // Stamp the owning RMachine's reset capability so test helpers can reach it
  // from `r.plug` alone (see `getPlugMachine` / `@r-machine/testing`).
  if (connector.machine !== undefined) {
    setPlugMachine(plug, connector.machine);
  }

  // Shared per-resolve ctx augmenter (locale + ports + user augmentCtx). Used
  // by both the async and the sync plug resolve so they build an identical `$`.
  const makeBuildCtx2 = (locale: AnyLocale | undefined): PluginCtxAugmenter => {
    return ($) => {
      if (meta.family === "shell") {
        $.locale = locale;
      }
      $.ports = head.ports;
      return augmentCtx !== undefined ? augmentCtx($) : defaultBuildCtx($);
    };
  };

  // `res.perLocale(...)` deps: build one locale loader per declared shell (locale is
  // supplied by the caller at invocation, so the loaders are locale-agnostic
  // and built once). `injectShellPickers` layers them onto the resolved dep plugin
  // at their declared position WITHOUT mutating the (wire-cached, possibly
  // shared) plugin — map: copy descriptors so lazy kit getters stay lazy; list:
  // re-insert each loader at its original tuple index.
  const shellDeps = head.shellDeps;
  const makeLoader =
    (shellNs: AnyNamespace) =>
    (locale: AnyLocale): Promise<unknown> => {
      // Defensive: a real RMachine connector always provides `resolveShell`. Only
      // a bare composer (unit test wiring) could omit it, and only if it both
      // declared a picker dep AND invoked the loader — never happens in practice.
      /* v8 ignore next 3 */
      if (connector.resolveShell === undefined) {
        throw new Error(`Cannot resolve shell "${shellNs}": this connector has no resolveShell (bare composer?).`);
      }
      return connector.resolveShell(shellNs, locale);
    };
  const injectShellPickers =
    shellDeps === undefined
      ? (plugin: unknown): unknown => plugin
      : (plugin: unknown): unknown => {
          if (head.mode === "map") {
            const src = plugin as Record<string, unknown>;
            const out: Record<string, unknown> = {};
            for (const key of Reflect.ownKeys(src)) {
              Object.defineProperty(out, key, Object.getOwnPropertyDescriptor(src, key)!);
            }
            for (const key in shellDeps) {
              out[key] = makeLoader(shellDeps[key]);
            }
            return out;
          }
          // list: [...compactedDeps, $] → re-interleave loaders by original index
          const arr = plugin as unknown[];
          const ctx$ = arr[arr.length - 1];
          const compacted = arr.slice(0, -1);
          const origLen = compacted.length + Object.keys(shellDeps).length;
          const out: unknown[] = [];
          let ci = 0;
          for (let i = 0; i < origLen; i++) {
            const shellNs = shellDeps[String(i)];
            out.push(shellNs !== undefined ? makeLoader(shellNs) : compacted[ci++]);
          }
          out.push(ctx$);
          return out;
        };

  setPlugResolve(plug, async (locale: AnyLocale | undefined, chain: readonly AnyNamespace[]) => {
    const wire = await connector.getWire(head.nsDeps, locale, makeBuildCtx2(locale), chain);
    return injectShellPickers(wire.plugin) as never;
  });

  // Sync sibling of the plug resolve. Declines (ASYNC) when the connector has
  // no sync path or any transitive dep isn't synchronously resolvable.
  setPlugResolveSync(plug, (locale: AnyLocale | undefined, chain: readonly AnyNamespace[]) => {
    if (connector.getWireSync === undefined) {
      return ASYNC;
    }
    const wire = connector.getWireSync(head.nsDeps, locale, makeBuildCtx2(locale), chain);
    if (wire === ASYNC) {
      return ASYNC;
    }
    return injectShellPickers(wire.plugin) as never;
  });

  // Eligibility holder mutated by `create` (below) and read via
  // `isResMatrixSyncEligible`. Starts false → the first resolve always takes
  // the async path, which proves whether the factory is synchronous.
  const eligibility = { eligible: false };

  // `chain` defaults to empty so the public `create(): () => Promise<R>`
  // contract holds when called with no args (e.g. `r.create()` in resource-level
  // tests, §14.2). Internal callers that thread a resolution chain pass it
  // explicitly.
  const create = async (
    locale: AnyLocale | undefined = undefined,
    chain: readonly AnyNamespace[] = []
  ): Promise<AnyRes> => {
    const plugin = await getPlugResolve(plug)(locale, chain);
    // selfNs is the last entry of the chain (the namespace currently being
    // resolved). Passed to the cursor factory so namespace-aware cursors
    // (e.g., OuterGear's stateful cursor) can tag the actions/relays they
    // build with the OG's own namespace — needed by the relay ordering
    // provider to compute depth(relay) relative to mutation sources.
    const selfNs = chain.length > 0 ? chain[chain.length - 1] : undefined;
    const resolvedCursor = typeof cursor === "function" ? (cursor as CursorFactory)(plugin, selfNs) : cursor;
    const rawOrPromise = userFactory(plugin, resolvedCursor as never);
    // Tier B inference: the user factory proves itself synchronous when it
    // returns a non-thenable. Stamp eligibility so a later sync resolve may run
    // it in render phase. (Whether the DEPS are synchronously resolvable is
    // re-checked independently each time `createSync` runs.)
    eligibility.eligible = !isThenable(rawOrPromise);
    const raw = await rawOrPromise;
    return (postProcess ? postProcess(raw, resolvedCursor as never) : raw) as AnyRes;
  };

  const createSync = (
    locale: AnyLocale | undefined = undefined,
    chain: readonly AnyNamespace[] = []
  ): AnyRes | typeof ASYNC => {
    const plugin = getPlugResolveSync(plug)(locale, chain);
    if (plugin === ASYNC) {
      return ASYNC;
    }
    const selfNs = chain.length > 0 ? chain[chain.length - 1] : undefined;
    const resolvedCursor = typeof cursor === "function" ? (cursor as CursorFactory)(plugin, selfNs) : cursor;
    const raw = userFactory(plugin, resolvedCursor as never);
    // Defensive: createSync is only invoked when eligible, but a pathological
    // factory that flips to async still bails cleanly here.
    if (isThenable(raw)) {
      return ASYNC;
    }
    return (postProcess ? postProcess(raw, resolvedCursor as never) : raw) as AnyRes;
  };

  return {
    [resMatrixMetaSymbol]: meta,
    create: create as () => Promise<AnyRes>,
    createSync: createSync as () => AnyRes | typeof ASYNC,
    plug,
    [resMatrixSyncEligibleSymbol]: eligibility,
  };
}
