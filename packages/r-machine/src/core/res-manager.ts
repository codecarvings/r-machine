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
  ERR_CIRCULAR_DEPENDENCY,
  ERR_VERTEX_AT_PROCESS_SCOPE,
  ERR_VERTEX_INSTANCE_NOT_FOUND,
  RMachineResolveError,
} from "#r-machine/errors";
import type { AnyLocale } from "#r-machine/locale";
import type { Blueprint } from "./blueprint.js";
import { type BlueprintManager, getBlueprintResCacheKey } from "./blueprint-manager.js";
import type { BusHost } from "./event-bus.js";
import type { PluginCtxAugmenter } from "./plug.js";
import { type AnyRes, tryGetDispose } from "./res.js";
import type { AnyNamespace, AnyNamespaceCollection } from "./res-domain.js";
import type { AnyResEquipment } from "./res-equipment.js";
import { isOuterGearLayoutType, type ResLayoutEntryType, type ResLayoutResolver } from "./res-layout.js";
import { type AnyNamespaceList, type AnyResolvedNamespaceList, isNamespaceList } from "./res-list.js";
import type { AnyNamespaceMap, AnyResolvedNamespaceMap } from "./res-map.js";
import { type AnyResMatrix, isResMatrixSyncEligible } from "./res-matrix.js";
import { buildResPod, type ResPod } from "./res-pod.js";
import { attachResolveContext } from "./resolve-context.js";
import { PROCESS_SCOPE_PROVIDER, type RequestScope, type RequestScopeProvider, type Slot } from "./scope.js";
import type { AnySurface } from "./surface.js";
import { ASYNC, COVERED_PENDING } from "./sync-resolve.js";
import { buildVertexKey, type VertexGearMap, type VertexGearTagData } from "./vertex-gear.js";

// SEP = U+001F (Unit Separator). An empty locale prefix means `undefined`.
// For res-manager: both `shell` and `shell(mono)` need a
// locale-scoped key — at the res level the same shell namespace must
// resolve to different plugin instances per locale.
//
// For `gear:outer(vertex)` the third argument is the composite `vertexKey`
// (`${genId}\x1f${occurrenceTag}`, see `buildVertexKey`). Same formula in
// both creator and covered paths — the creator builds it from
// `(wire.genId, depOccurrenceTag)`, the covered path reads it as-is from
// `VertexGearMap[ns]`. The composite means duplicate vertex deps under one
// wire produce DISTINCT slot keys (because their `occurrenceTag` differs),
// while a VertexFrame-covered descendant lookup lands on the parent's slot
// by reusing the parent's `vertexKey` verbatim. See [[project-vertex-per-
// consumer-instance]].
export function getResCacheKey(
  namespace: AnyNamespace,
  locale: AnyLocale | undefined,
  layoutEntryType: ResLayoutEntryType,
  vertexKey?: string
): string {
  switch (layoutEntryType) {
    case "shell":
    case "shell(mono)":
      return `S:${locale}\x1f${namespace}`;
    case "gear:outer(vertex)":
      return `V:${namespace}\x1f${vertexKey ?? ""}`;
    default:
      return `\x1f${namespace}`;
  }
}

export class ResManager {
  constructor(
    protected resLayoutResolver: ResLayoutResolver,
    protected equipment: AnyResEquipment,
    protected blueprintManager: BlueprintManager,
    protected busHost: BusHost
  ) {
    blueprintManager.setOnInvalidate((ns, locale) => this.invalidate(ns, locale));
  }

  // Process-tier slots: Base + Inner + Shell live here for the lifetime of the
  // RMachine instance. Outer (and Outer-vertex) slots are routed via
  // `slotsForLayout` to either a request-scoped map (when a scope is active)
  // or this same `slots` map (fallback for client browser, tests, etc.).
  protected readonly slots = new Map<string, Slot>();
  protected readonly generationByNs = new Map<AnyNamespace, number>();
  protected readonly subscribersByNs = new Map<AnyNamespace, Set<() => void>>();
  // Two-level index of vertex slots created under each wire's `genId`.
  // Outer key: genId. Inner map: namespace → set of `occurrenceTag`s active
  // for that (genId, namespace). Multiple tags coexist when a Plug declares
  // the same vertex namespace at multiple positions/keys — each tag identifies
  // a distinct slot. See [[project-vertex-per-consumer-instance]].
  protected readonly vertexSlotsByGenId = new Map<number, Map<AnyNamespace, Set<string>>>();

  protected scopeProvider: RequestScopeProvider = PROCESS_SCOPE_PROVIDER;

  setScopeProvider(p: RequestScopeProvider): void {
    this.scopeProvider = p;
  }

  getScopeProvider(): RequestScopeProvider {
    return this.scopeProvider;
  }

  // Routes Outer/Vertex slot lookups to the active request scope when one is
  // installed (e.g. inside an HTTP request); otherwise falls back to the
  // process-shared `slots` map. Base/Inner/Shell always use `slots` directly —
  // they're stateless or locale-keyed and safe to cache across requests.
  protected slotsForLayout(layoutType: ResLayoutEntryType): Map<string, Slot> {
    if (!isOuterGearLayoutType(layoutType)) {
      return this.slots;
    }
    const scope = this.scopeProvider.getActiveScope();
    if (!scope) {
      return this.slots;
    }
    return layoutType === "gear:outer(vertex)" ? scope.vertexSlots : scope.outerSlots;
  }

  protected vertexIndex(): Map<number, Map<AnyNamespace, Set<string>>> {
    const scope = this.scopeProvider.getActiveScope();
    return scope ? scope.vertexSlotsByGenId : this.vertexSlotsByGenId;
  }

  protected resolvePod(
    namespace: AnyNamespace,
    locale: AnyLocale | undefined,
    key: string,
    layoutType: ResLayoutEntryType,
    vertexTag: VertexGearTagData | undefined,
    chain: readonly AnyNamespace[]
  ): Promise<ResPod> {
    const generation = this.generationByNs.get(namespace) ?? 0;
    this.busHost.bus?.emit({
      type: "res:resolveStart",
      namespace,
      locale,
      generation,
      vertexGenId: vertexTag?.genId,
    });
    // Capture the slot map once: same instance must back both the SET below
    // and the identity / delete checks inside the async closure. If the active
    // request scope changes mid-flight (extremely unlikely — would require
    // ALS context-hopping during a single resolve), we'd otherwise risk
    // mismatch. Capture-once guarantees consistency.
    const slotsMap = this.slotsForLayout(layoutType);
    let slot!: Slot;
    // The BLUEPRINT is cached per (namespace, locale) — NOT per the res slot
    // key. For vertex gears the slot `key` is per-instance (genId + occurrence
    // tag), but their blueprint (the module/factory + dep graph) is identical
    // across instances. Keying the blueprint by the slot key would re-import
    // the module for every instance AND make a freshly-mounted vertex consumer
    // (new wire → new genId) miss the cache, defeating the Tier-B sync fast
    // path on navigation. `getBlueprintResCacheKey` is the dedicated, genId-
    // agnostic blueprint key (also used by the BM's own dep preloading).
    const blueprintKey = getBlueprintResCacheKey(namespace, locale, layoutType);
    const podPromise = (async () => {
      try {
        const blueprint: Blueprint = await this.blueprintManager.getBlueprint(
          namespace,
          locale,
          layoutType,
          blueprintKey
        );
        let pod: ResPod;
        if (blueprint.originType === "res") {
          pod = buildResPod(blueprint.origin as AnyRes, vertexTag);
          this.busHost.bus?.emit({ type: "res:built", namespace });
        } else {
          const create = blueprint.origin.create as (
            locale: AnyLocale | undefined,
            chain: readonly AnyNamespace[]
          ) => Promise<AnyRes>;
          // Extend the chain with our own namespace before invoking the factory:
          // any nested loadKit / getPod under us will see us as in-flight
          // and break cycles via the deferred-kit getter. The "self" of the
          // running factory is implicitly chain[chain.length - 1].
          this.busHost.bus?.emit({ type: "res:factoryInvoked", namespace, locale });
          const res = await create(locale, [...chain, namespace]);
          pod = buildResPod(res, vertexTag);
          this.busHost.bus?.emit({ type: "res:built", namespace });
        }
        // Stale check: generation mismatch (HMR happened) OR slot identity mismatch
        // (slot was disposed and possibly re-created during this resolve).
        const currentGen = this.generationByNs.get(namespace) ?? 0;
        const generationStale = currentGen !== generation;
        const slotIdentityStale = slotsMap.get(key) !== slot;
        if (generationStale || slotIdentityStale) {
          const teardown = tryGetDispose(pod.res);
          if (teardown) {
            try {
              teardown();
            } catch (e) {
              console.error(e);
            }
          }
          this.busHost.bus?.emit({
            type: "res:resolveStale",
            namespace,
            reason: generationStale ? "generation" : "slotIdentity",
            teardownInvoked: teardown !== undefined,
          });
          return pod;
        }
        slot.content = pod;
        this.busHost.bus?.emit({ type: "res:slotCommitted", namespace, generation });
        return pod;
      } catch (error) {
        if (slotsMap.get(key) === slot) {
          slotsMap.delete(key);
        }
        // Attach attribution (deepest namespace wins) without changing the
        // error's identity, then re-throw verbatim so framework control-flow
        // (notFound/redirect) and domain `instanceof` checks still work.
        const resolveChain: readonly AnyNamespace[] = [...chain, namespace];
        attachResolveContext(error, { namespace, locale, chain: resolveChain });
        this.busHost.bus?.emit({ type: "res:resolveError", namespace, error, chain: resolveChain });
        throw error;
      }
    })();
    slot = { key, namespace, generation, content: podPromise };
    slotsMap.set(key, slot);
    return podPromise;
  }

  protected isSlotFresh(slot: Slot): boolean {
    return slot.generation === (this.generationByNs.get(slot.namespace) ?? 0);
  }

  protected async getPod(
    namespace: AnyNamespace,
    locale: AnyLocale | undefined,
    genId: number,
    vertexGearMap: VertexGearMap | undefined,
    chain: readonly AnyNamespace[],
    // Discriminator within a single wire's deps list/map. For list-mode
    // plugs the caller passes `String(index)`; for map-mode plugs the dep
    // key. Required for vertex creator path so duplicate vertex deps under
    // one wire get distinct slots. Ignored for non-vertex layouts and for
    // the vertex covered path (which uses the parent's tag transported via
    // `vertexGearMap`). Defaults to `""` only as a defensive fallback.
    occurrenceTag: string = ""
  ): Promise<ResPod> {
    const layoutType = this.resLayoutResolver.resolveLayoutEntryType(namespace);
    const slotsMap = this.slotsForLayout(layoutType);
    if (layoutType === "gear:outer(vertex)") {
      // Invariant guard: vertex slots are per-consumer and keyed in the genId
      // index for disposal at wire teardown (`disposeAllVertexSlotsByGenId`).
      // genId 0 is the reserved process/kit sentinel (wires start at 1 via
      // `++nextGenId`) and is never torn down per-consumer, so a vertex slot
      // minted under it would leak silently. The two genId-0 callers — kit
      // resolution (`loadKit`) and gear→gear deps (`createResComposerConnector`)
      // — are both type-constrained to exclude vertex namespaces, so this can
      // only fire if an untyped/`as any` caller or a future loosening breaches
      // that contract. Fail loud here rather than leak.
      if (genId === 0) {
        throw new RMachineResolveError(
          ERR_VERTEX_AT_PROCESS_SCOPE,
          `Vertex gear "${namespace}" cannot be resolved at process/kit scope (genId 0). Vertex gears are per-consumer and may only appear in a consumer Plug's deps — not in a kit or as a gear→gear dependency.`
        );
      }
      const parentVertexKey = vertexGearMap?.[namespace];
      if (parentVertexKey !== undefined) {
        const consumerKey = getResCacheKey(namespace, locale, layoutType, parentVertexKey);
        const consumerSlot = slotsMap.get(consumerKey);
        if (consumerSlot === undefined || !this.isSlotFresh(consumerSlot)) {
          this.busHost.bus?.emit({ type: "res:vertexConsumerMissing", namespace, vertexKey: parentVertexKey });
          throw new RMachineResolveError(
            ERR_VERTEX_INSTANCE_NOT_FOUND,
            `Vertex gear instance "${namespace}" with vertexKey "${parentVertexKey}" not found in ResManager cache.`
          );
        }
        this.busHost.bus?.emit({
          type: "res:vertexConsumerResolved",
          namespace,
          consumerVertexKey: parentVertexKey,
        });
        return consumerSlot.content;
      }
      const myVertexKey = buildVertexKey(genId, occurrenceTag);
      const creatorKey = getResCacheKey(namespace, locale, layoutType, myVertexKey);
      const creatorSlot = slotsMap.get(creatorKey);
      if (creatorSlot !== undefined && this.isSlotFresh(creatorSlot)) {
        this.busHost.bus?.emit({
          type: "res:cacheHit",
          namespace,
          locale,
          generation: creatorSlot.generation,
        });
        return creatorSlot.content;
      }
      // Register vertex creation in genId index before spawning the resolve,
      // so the index and slots map are populated together (resolvePod
      // creates the slot synchronously before returning the promise). The
      // inner Map<ns, Set<occurrenceTag>> lets multiple slots for the same
      // (genId, ns) coexist when a Plug has duplicate vertex deps.
      const vertexIdx = this.vertexIndex();
      let byNs = vertexIdx.get(genId);
      if (!byNs) {
        byNs = new Map();
        vertexIdx.set(genId, byNs);
      }
      let tags = byNs.get(namespace);
      if (!tags) {
        tags = new Set();
        byNs.set(namespace, tags);
      }
      tags.add(occurrenceTag);
      this.busHost.bus?.emit({ type: "res:vertexSlotRegistered", namespace, genId, occurrenceTag });
      return this.resolvePod(namespace, locale, creatorKey, layoutType, { namespace, genId, occurrenceTag }, chain);
    }

    const key = getResCacheKey(namespace, locale, layoutType);
    const cached = slotsMap.get(key);
    if (cached !== undefined && this.isSlotFresh(cached)) {
      this.busHost.bus?.emit({ type: "res:cacheHit", namespace, locale, generation: cached.generation });
      return cached.content;
    }
    return this.resolvePod(namespace, locale, key, layoutType, undefined, chain);
  }

  // Synchronous sibling of `getPod`. Returns a pod when it is already resolved
  // (warm fresh slot, non-Promise content) OR when it can be created
  // synchronously (Tier B: cached blueprint + sync-eligible factory, via
  // `resolvePodSync`). Returns the `ASYNC` sentinel for anything that cannot be
  // done without awaiting, so the caller falls back to the async `getPod`.
  //
  // The covered-vertex missing/stale case returns ASYNC instead of throwing:
  // the async `getPod` owns the `ERR_VERTEX_INSTANCE_NOT_FOUND` throw with its
  // resolve-context attribution.
  protected getPodSync(
    namespace: AnyNamespace,
    locale: AnyLocale | undefined,
    genId: number,
    vertexGearMap: VertexGearMap | undefined,
    chain: readonly AnyNamespace[],
    occurrenceTag: string = ""
  ): ResPod | typeof ASYNC | typeof COVERED_PENDING {
    const layoutType = this.resLayoutResolver.resolveLayoutEntryType(namespace);
    const slotsMap = this.slotsForLayout(layoutType);
    if (layoutType === "gear:outer(vertex)") {
      // Same genId-0 invariant as the async `getPod` (see its comment): a vertex
      // slot must never be minted at process/kit scope, where it would never be
      // disposed. Reachable here via the sync gear→gear deps path (`getWireSync`).
      if (genId === 0) {
        throw new RMachineResolveError(
          ERR_VERTEX_AT_PROCESS_SCOPE,
          `Vertex gear "${namespace}" cannot be resolved at process/kit scope (genId 0). Vertex gears are per-consumer and may only appear in a consumer Plug's deps — not in a kit or as a gear→gear dependency.`
        );
      }
      const parentVertexKey = vertexGearMap?.[namespace];
      if (parentVertexKey !== undefined) {
        // Covered path: a parent VertexFrame owns this instance. We never
        // create it here — only read the parent's slot when already resolved.
        const consumerKey = getResCacheKey(namespace, locale, layoutType, parentVertexKey);
        const consumerSlot = slotsMap.get(consumerKey);
        if (consumerSlot === undefined || !this.isSlotFresh(consumerSlot) || consumerSlot.content instanceof Promise) {
          // The parent (creator) slot is transiently absent/stale (e.g. HMR
          // invalidate disposed it and it has not been re-committed yet).
          // Return COVERED_PENDING — NOT ASYNC — so the wire suspends and
          // retries instead of falling through to the async path, whose covered
          // branch throws ERR_VERTEX_INSTANCE_NOT_FOUND.
          return COVERED_PENDING;
        }
        this.busHost.bus?.emit({
          type: "res:vertexConsumerResolved",
          namespace,
          consumerVertexKey: parentVertexKey,
        });
        return consumerSlot.content;
      }
      const myVertexKey = buildVertexKey(genId, occurrenceTag);
      const creatorKey = getResCacheKey(namespace, locale, layoutType, myVertexKey);
      const creatorSlot = slotsMap.get(creatorKey);
      if (creatorSlot !== undefined && this.isSlotFresh(creatorSlot) && !(creatorSlot.content instanceof Promise)) {
        this.busHost.bus?.emit({ type: "res:cacheHit", namespace, locale, generation: creatorSlot.generation });
        return creatorSlot.content;
      }
      // Creator miss → try Tier B sync creation. Register the vertex index
      // entry AFTER a successful commit (unlike the async getPod, which
      // registers before resolvePod): resolvePodSync may decline with ASYNC
      // without creating a slot, and we must not leave a phantom index tag.
      const pod = this.resolvePodSync(
        namespace,
        locale,
        creatorKey,
        layoutType,
        { namespace, genId, occurrenceTag },
        chain,
        slotsMap
      );
      if (pod === ASYNC) {
        return ASYNC;
      }
      const vertexIdx = this.vertexIndex();
      let byNs = vertexIdx.get(genId);
      if (!byNs) {
        byNs = new Map();
        vertexIdx.set(genId, byNs);
      }
      let tags = byNs.get(namespace);
      if (!tags) {
        tags = new Set();
        byNs.set(namespace, tags);
      }
      tags.add(occurrenceTag);
      this.busHost.bus?.emit({ type: "res:vertexSlotRegistered", namespace, genId, occurrenceTag });
      return pod;
    }

    const key = getResCacheKey(namespace, locale, layoutType);
    const cached = slotsMap.get(key);
    if (cached !== undefined && this.isSlotFresh(cached) && !(cached.content instanceof Promise)) {
      this.busHost.bus?.emit({ type: "res:cacheHit", namespace, locale, generation: cached.generation });
      return cached.content;
    }
    return this.resolvePodSync(namespace, locale, key, layoutType, undefined, chain, slotsMap);
  }

  // Synchronous sibling of `resolvePod`. Builds the pod WITHOUT awaiting: it
  // needs the blueprint already cached (`getBlueprintSync`) and, for factory
  // resources, the matrix proven sync-eligible (`createSync` ran sync once on
  // the async path). Returns ASYNC otherwise. A synchronous throw from the user
  // factory propagates up to the wire's resolve(), which falls back to the
  // async path so the error surfaces with full resolve-context attribution.
  //
  // No `await` happens, so the async path's post-await stale checks
  // (generation / slot-identity drift) are unnecessary — nothing can interleave
  // between the freshness read and the commit. The slot is created only on
  // success, holding the resolved pod directly (no in-flight Promise slot).
  protected resolvePodSync(
    namespace: AnyNamespace,
    locale: AnyLocale | undefined,
    key: string,
    layoutType: ResLayoutEntryType,
    vertexTag: VertexGearTagData | undefined,
    chain: readonly AnyNamespace[],
    slotsMap: Map<string, Slot>
  ): ResPod | typeof ASYNC {
    // Blueprint keyed per (namespace, locale), genId-agnostic (see resolvePod).
    // This is what lets a fresh vertex consumer (new wire/genId) find the
    // cached blueprint and create its pod synchronously.
    const blueprintKey = getBlueprintResCacheKey(namespace, locale, layoutType);
    const blueprint = this.blueprintManager.getBlueprintSync(namespace, locale, layoutType, blueprintKey);
    if (blueprint === ASYNC) {
      return ASYNC;
    }
    let pod: ResPod;
    if (blueprint.originType === "res") {
      pod = buildResPod(blueprint.origin as AnyRes, vertexTag);
    } else {
      if (!isResMatrixSyncEligible(blueprint.origin)) {
        return ASYNC;
      }
      const createSync = (blueprint.origin as AnyResMatrix).createSync as (
        locale: AnyLocale | undefined,
        chain: readonly AnyNamespace[]
      ) => AnyRes | typeof ASYNC;
      this.busHost.bus?.emit({ type: "res:factoryInvoked", namespace, locale });
      const res = createSync(locale, [...chain, namespace]);
      if (res === ASYNC) {
        return ASYNC;
      }
      pod = buildResPod(res, vertexTag);
    }
    const generation = this.generationByNs.get(namespace) ?? 0;
    const slot: Slot = { key, namespace, generation, content: pod };
    slotsMap.set(key, slot);
    this.busHost.bus?.emit({ type: "res:slotCommitted", namespace, generation });
    return pod;
  }

  async getPlugin(
    kit: AnyNamespaceMap,
    nsDeps: AnyNamespaceCollection,
    locale: AnyLocale | undefined,
    augmentCtx: PluginCtxAugmenter,
    chain: readonly AnyNamespace[],
    genId: number,
    vertexGearMap: VertexGearMap | undefined
  ): Promise<unknown> {
    const isList = isNamespaceList(nsDeps);
    // Partition kit entries:
    //   - eager: ns is NOT in chain → resolved now.
    //   - deferred: ns IS in chain (a transitive ancestor — includes self,
    //     which is chain[chain.length - 1]) → installed as a lazy getter
    //     after the eager resolves, since pre-resolving them would deadlock.
    const eagerKitEntries: Array<readonly [string, AnyNamespace]> = [];
    const deferredKitEntries: Array<readonly [string, AnyNamespace]> = [];
    for (const entry of Object.entries(kit)) {
      if (chain.includes(entry[1])) {
        deferredKitEntries.push(entry);
      } else {
        eagerKitEntries.push(entry);
      }
    }
    this.busHost.bus?.emit({
      type: "res:kitPartitioned",
      selfNamespace: chain.length > 0 ? chain[chain.length - 1] : undefined,
      eager: eagerKitEntries.map(([, ns]) => ns),
      deferred: deferredKitEntries.map(([, ns]) => ns),
    });

    const [kitDeps, deps] = await Promise.all([
      this.loadKit(eagerKitEntries, locale, chain),
      isList
        ? this.loadListDeps(nsDeps, locale, genId, vertexGearMap, chain)
        : this.loadMapDeps(nsDeps, locale, genId, vertexGearMap, chain),
    ]);

    return isList
      ? this.buildListPlugin(kitDeps, deps as AnyResolvedNamespaceList, locale, augmentCtx, deferredKitEntries)
      : this.buildMapPlugin(kitDeps, deps as AnyResolvedNamespaceMap, locale, augmentCtx, deferredKitEntries);
  }

  // Synchronous sibling of `getPlugin`: assembles the plugin WITHOUT awaiting,
  // by reading every eager-kit entry and every dep from already-resolved slots
  // via `getPodSync`. Returns the `ASYNC` sentinel the moment any pod is not
  // synchronously available, so the caller (wire `resolve()`) falls back to the
  // async `getPlugin`.
  //
  // Mirrors `getPlugin`'s kit partition and reuses the SAME synchronous
  // `buildListPlugin`/`buildMapPlugin` builders (including the deferred-kit
  // cycle getters), so a sync-assembled plugin is byte-identical to the async
  // one. Deps are resolved sequentially rather than via `Promise.all` — with
  // all pods already warm there is no I/O to overlap, so ordering is moot.
  getPluginSync(
    kit: AnyNamespaceMap,
    nsDeps: AnyNamespaceCollection,
    locale: AnyLocale | undefined,
    augmentCtx: PluginCtxAugmenter,
    chain: readonly AnyNamespace[],
    genId: number,
    vertexGearMap: VertexGearMap | undefined
  ): unknown | typeof ASYNC | typeof COVERED_PENDING {
    const isList = isNamespaceList(nsDeps);
    const eagerKitEntries: Array<readonly [string, AnyNamespace]> = [];
    const deferredKitEntries: Array<readonly [string, AnyNamespace]> = [];
    for (const entry of Object.entries(kit)) {
      if (chain.includes(entry[1])) {
        deferredKitEntries.push(entry);
      } else {
        eagerKitEntries.push(entry);
      }
    }

    // Eager kit: each must already be a committed pod. Kit entries carry no
    // vertexGearMap, so they can never hit the covered path (no COVERED_PENDING);
    // the defensive check just narrows the type.
    const kitPairs: Array<readonly [string, AnySurface]> = [];
    for (const [k, ns] of eagerKitEntries) {
      const pod = this.getPodSync(ns, locale, 0, undefined, chain);
      if (pod === ASYNC || pod === COVERED_PENDING) {
        return ASYNC;
      }
      kitPairs.push([k, pod.surface]);
    }
    const kitDeps = Object.fromEntries(kitPairs) as AnyResolvedNamespaceMap;

    // A covered vertex dep whose parent slot is transiently missing returns
    // COVERED_PENDING. It DOMINATES ASYNC: we must not fall through to the async
    // path (its covered branch throws). Return it so the wire suspends + retries.
    let deps: AnyResolvedNamespaceList | AnyResolvedNamespaceMap;
    if (isList) {
      const list: AnySurface[] = [];
      const nsList = nsDeps as AnyNamespaceList;
      for (let i = 0; i < nsList.length; i++) {
        const pod = this.getPodSync(nsList[i] as AnyNamespace, locale, genId, vertexGearMap, chain, String(i));
        if (pod === COVERED_PENDING) {
          return COVERED_PENDING;
        }
        if (pod === ASYNC) {
          return ASYNC;
        }
        list.push(pod.surface);
      }
      deps = list;
    } else {
      const pairs: Array<readonly [string, AnySurface]> = [];
      for (const [key, namespace] of Object.entries(nsDeps as AnyNamespaceMap)) {
        const pod = this.getPodSync(namespace, locale, genId, vertexGearMap, chain, key);
        if (pod === COVERED_PENDING) {
          return COVERED_PENDING;
        }
        if (pod === ASYNC) {
          return ASYNC;
        }
        pairs.push([key, pod.surface]);
      }
      deps = Object.fromEntries(pairs) as AnyResolvedNamespaceMap;
    }

    // Only commit to emitting the partition event once we know the whole graph
    // resolved synchronously (so a partial sync attempt that bails leaves no
    // misleading trace).
    this.busHost.bus?.emit({
      type: "res:kitPartitioned",
      selfNamespace: chain.length > 0 ? chain[chain.length - 1] : undefined,
      eager: eagerKitEntries.map(([, ns]) => ns),
      deferred: deferredKitEntries.map(([, ns]) => ns),
    });

    return isList
      ? this.buildListPlugin(kitDeps, deps as AnyResolvedNamespaceList, locale, augmentCtx, deferredKitEntries)
      : this.buildMapPlugin(kitDeps, deps as AnyResolvedNamespaceMap, locale, augmentCtx, deferredKitEntries);
  }

  // Returns a getter that resolves a chain-deferred kit entry from its slot
  // at access time. While the slot is still mid-resolution (Promise content),
  // accessing it would mean a real cyclic kit dependency — throw with a clear
  // message. Once the ancestor's factory has committed its pod, the
  // captured reference works (supports late-bound recursive patterns,
  // including self-reference: self is just chain[last]).
  protected createDeferredKitGetter(namespace: AnyNamespace, locale: AnyLocale | undefined): () => AnySurface {
    const layoutType = this.resLayoutResolver.resolveLayoutEntryType(namespace);
    const slotKey = getResCacheKey(namespace, locale, layoutType);
    return () => {
      // Re-resolve the slot map each call: a deferred-kit getter created
      // during one resolution may be called later (inside a child plugin's
      // builder) and the active request scope at that later moment is what
      // matters. For Outer types this hits the same scope as the original
      // resolve when invocation stays within the same async chain.
      const slot = this.slotsForLayout(layoutType).get(slotKey);
      if (slot === undefined || slot.content instanceof Promise) {
        this.busHost.bus?.emit({ type: "res:deferredKitAccessed", namespace, ready: false });
        throw new RMachineResolveError(
          ERR_CIRCULAR_DEPENDENCY,
          `Kit access on "${namespace}" is not available: that namespace is currently being resolved as a transitive ancestor.`
        );
      }
      this.busHost.bus?.emit({ type: "res:deferredKitAccessed", namespace, ready: true });
      return slot.content.surface;
    };
  }

  protected async loadKit(
    entries: ReadonlyArray<readonly [string, AnyNamespace]>,
    locale: AnyLocale | undefined,
    chain: readonly AnyNamespace[]
  ): Promise<AnyResolvedNamespaceMap> {
    const resolved = await Promise.all(
      entries.map(async ([k, ns]) => [k, (await this.getPod(ns, locale, 0, undefined, chain)).surface] as const)
    );
    return Object.fromEntries(resolved);
  }

  protected async loadMapDeps(
    nsDeps: AnyNamespaceMap,
    locale: AnyLocale | undefined,
    genId: number,
    vertexGearMap: VertexGearMap | undefined,
    chain: readonly AnyNamespace[]
  ): Promise<AnyResolvedNamespaceMap> {
    // Pass the map key as `occurrenceTag` so two entries pointing to the same
    // vertex namespace (e.g. `{ a: "vertex/timer", b: "vertex/timer" }`)
    // resolve to distinct slots — the keys `a` / `b` discriminate them.
    const entries = await Promise.all(
      Object.entries(nsDeps).map(async ([key, namespace]) => [
        key,
        (await this.getPod(namespace, locale, genId, vertexGearMap, chain, key)).surface,
      ])
    );
    return Object.fromEntries(entries);
  }

  protected async loadListDeps(
    nsDeps: AnyNamespaceList,
    locale: AnyLocale | undefined,
    genId: number,
    vertexGearMap: VertexGearMap | undefined,
    chain: readonly AnyNamespace[]
  ): Promise<AnyResolvedNamespaceList> {
    // Pass the list index as `occurrenceTag` so duplicate vertex namespaces
    // (`["vertex/timer", "vertex/timer"]`) resolve to distinct slots — the
    // positions `"0"` / `"1"` discriminate them.
    return Promise.all(
      nsDeps.map(
        async (namespace, index) =>
          (await this.getPod(namespace as AnyNamespace, locale, genId, vertexGearMap, chain, String(index))).surface
      )
    );
  }

  protected buildListPlugin(
    kit: AnyResolvedNamespaceMap,
    deps: AnyResolvedNamespaceList,
    locale: AnyLocale | undefined,
    augmentCtx: PluginCtxAugmenter,
    deferredKitEntries: ReadonlyArray<readonly [string, AnyNamespace]>
  ): unknown {
    const $ = { kit };
    augmentCtx($);
    const plugin = [...deps, $];
    // Install deferred-resolve getters AFTER any spread, so they remain lazy.
    for (const [k, ns] of deferredKitEntries) {
      const getter = this.createDeferredKitGetter(ns, locale);
      Object.defineProperty(kit, k, { enumerable: true, configurable: true, get: getter });
    }
    return plugin;
  }

  protected buildMapPlugin(
    kit: AnyResolvedNamespaceMap,
    deps: AnyResolvedNamespaceMap,
    locale: AnyLocale | undefined,
    augmentCtx: PluginCtxAugmenter,
    deferredKitEntries: ReadonlyArray<readonly [string, AnyNamespace]>
  ): unknown {
    const $ = { kit };
    augmentCtx($);
    // Spread happens with eager kit values only; deferred entries are added
    // below as lazy getters on both the kit object (for $.kit access) and
    // the top-level plugin (unless shadowed by a same-named dep).
    const plugin: AnyResolvedNamespaceMap = { ...kit, ...deps, $ };
    for (const [k, ns] of deferredKitEntries) {
      const getter = this.createDeferredKitGetter(ns, locale);
      Object.defineProperty(kit, k, { enumerable: true, configurable: true, get: getter });
      if (!(k in deps)) {
        Object.defineProperty(plugin, k, { enumerable: true, configurable: true, get: getter });
      }
    }
    return plugin;
  }

  // Dispose a slot from a given slot map. Used by invalidate (process tier
  // map), disposeVertex* (process tier or request scope, via slotsForLayout),
  // and disposeRequestScope (each request-scope map).
  protected disposeSlotIn(slotsMap: Map<string, Slot>, key: string): void {
    const slot = slotsMap.get(key);
    if (!slot) {
      return;
    }
    let teardownInvoked = false;
    if (!(slot.content instanceof Promise)) {
      const teardown = tryGetDispose(slot.content.res);
      if (teardown) {
        teardownInvoked = true;
        try {
          teardown();
        } catch (e) {
          console.error(e);
        }
      }
    }
    // In-flight: stale check at completion intercepts (slots.delete causes
    // identity mismatch and the resolved pod is discarded with teardown).
    slotsMap.delete(key);
    this.busHost.bus?.emit({ type: "res:slotDisposed", namespace: slot.namespace, teardownInvoked });
  }

  // Back-compat shim: dispose from the process-tier slots map.
  protected disposeSlot(key: string): void {
    this.disposeSlotIn(this.slots, key);
  }

  // Drop ALL resolved state held in the process-tier `slots` map: dispose every
  // slot (running `Symbol.dispose` teardowns) in dispose-safe order — dependents
  // before dependencies — then clear the generation / subscriber / vertex
  // indices. Blueprints (loaded modules) are intentionally KEPT, so the next
  // resolve re-runs the cached factories against fresh state rather than
  // re-importing. Request scopes are NOT touched (use `disposeRequestScope`).
  //
  // This is a hard wipe with no subscriber notification — a test-isolation
  // primitive (`RMachine.disposeResources`), not an HMR-style `invalidate`. Any
  // live wire still subscribed is orphaned by design; the next test builds fresh.
  disposeResources(): void {
    // Order namespaces dependents-first via the union of reverse closures, so a
    // teardown can still reference resources its dependencies hold.
    const roots = new Set<AnyNamespace>();
    for (const slot of this.slots.values()) {
      roots.add(slot.namespace);
    }
    const ordered = new Set<AnyNamespace>();
    for (const root of roots) {
      for (const n of this.blueprintManager.getReverseClosure(root)) {
        ordered.add(n);
      }
    }
    const keysByNs = new Map<AnyNamespace, string[]>();
    for (const slot of this.slots.values()) {
      let keys = keysByNs.get(slot.namespace);
      if (!keys) {
        keys = [];
        keysByNs.set(slot.namespace, keys);
      }
      keys.push(slot.key);
    }
    for (const n of ordered) {
      const keys = keysByNs.get(n);
      if (keys) {
        for (const key of keys) {
          this.disposeSlotIn(this.slots, key);
        }
      }
    }
    // Defensive sweep: dispose any slot whose namespace fell outside the closure
    // walk. Unreachable in practice — every slot namespace is a root and
    // `getReverseClosure` always includes its seed, so the ordered walk above
    // already disposed every slot — but kept so a slot can never leak.
    /* v8 ignore start */
    for (const key of [...this.slots.keys()]) {
      this.disposeSlotIn(this.slots, key);
    }
    /* v8 ignore stop */

    this.generationByNs.clear();
    this.subscribersByNs.clear();
    this.vertexSlotsByGenId.clear();
    this.busHost.bus?.emit({ type: "res:resourcesDisposed" });
  }

  invalidate(ns: AnyNamespace, locale?: AnyLocale | undefined): void {
    // The closure is iterated in dispose-safe order: dependents first, ns last.
    // (See BlueprintManager.getReverseClosure.)
    const closure = this.blueprintManager.getReverseClosure(ns);
    this.busHost.bus?.emit({
      type: "res:invalidationStart",
      rootNamespace: ns,
      locale,
      closure: [...closure],
    });
    // 1. Bump generation for every namespace in the closure. An in-flight
    //    resolve started before this point will see the new generation at its
    //    completion check and discard its pod. Generation is
    //    namespace-only — locale-scoped invalidation still bumps the whole
    //    namespace, so wires rendering in any locale observe staleness and
    //    re-resolve (re-resolves of unaffected locales hit the still-cached
    //    blueprint and produce the same plugin, so the work is bounded).
    for (const n of closure) {
      this.generationByNs.set(n, (this.generationByNs.get(n) ?? 0) + 1);
    }
    // 2. Eager dispose of resolved slots in the closure (teardown invoked).
    //    Group slot keys by namespace once, then walk the closure in dispose
    //    order — A is disposed before B if A depends on B, so A's teardown
    //    can safely reference resources held by B. When `locale` is given,
    //    shell slots are filtered to that locale (their key is prefixed
    //    `S:${locale}\x1f`); non-shell slots have locale-agnostic keys and
    //    are always included.
    const shellLocalePrefix = locale !== undefined ? `S:${locale}\x1f` : undefined;
    const keysByNs = new Map<AnyNamespace, string[]>();
    for (const slot of this.slots.values()) {
      if (!closure.has(slot.namespace)) {
        continue;
      }
      if (shellLocalePrefix !== undefined && slot.key.startsWith("S:") && !slot.key.startsWith(shellLocalePrefix)) {
        continue;
      }
      let keys = keysByNs.get(slot.namespace);
      if (!keys) {
        keys = [];
        keysByNs.set(slot.namespace, keys);
      }
      keys.push(slot.key);
    }
    for (const n of closure) {
      const keys = keysByNs.get(n);
      if (keys) {
        for (const key of keys) {
          this.disposeSlot(key);
        }
      }
    }
    // 3. Evict blueprints in the closure (must happen before notify so any
    //    re-resolve triggered by a subscriber callback loads fresh modules).
    //    Locale scope is forwarded — evictBlueprint applies it only when the
    //    layout entry is locale-keyed (i.e. `shell`).
    for (const n of closure) {
      this.blueprintManager.evictBlueprint(n, locale);
    }
    // 4. Notify subscribers. The "subscribersNotified" event fires BEFORE the
    //    callbacks run so the test transcript reads: notify → callback effects.
    for (const n of closure) {
      const subs = this.subscribersByNs.get(n);
      if (subs) {
        this.busHost.bus?.emit({
          type: "res:subscribersNotified",
          namespace: n,
          subscriberCount: subs.size,
        });
        for (const cb of subs) {
          try {
            cb();
          } catch (e) {
            console.error(e);
          }
        }
      }
    }
  }

  subscribe(nsList: Iterable<AnyNamespace>, callback: () => void): () => void {
    const subscribed: AnyNamespace[] = [];
    for (const ns of nsList) {
      let set = this.subscribersByNs.get(ns);
      if (!set) {
        set = new Set();
        this.subscribersByNs.set(ns, set);
      }
      set.add(callback);
      subscribed.push(ns);
    }
    this.busHost.bus?.emit({ type: "res:subscribed", namespaces: subscribed });
    return () => {
      for (const ns of subscribed) {
        const set = this.subscribersByNs.get(ns);
        set?.delete(callback);
        if (set && set.size === 0) {
          this.subscribersByNs.delete(ns);
        }
      }
      this.busHost.bus?.emit({ type: "res:unsubscribed", namespaces: subscribed });
    };
  }

  // Dispose ALL slots of `ns` created under `genId`. With per-occurrence
  // tags a single (genId, ns) pair can have multiple slots — when the
  // namespace becomes covered by a new ancestor `VertexFrame`, every
  // occurrence-owned slot must go (their resolution now routes through the
  // frame's slot). Caller: `disposeVertexSlotsByOwnershipChange`.
  disposeVertexSlotsForNamespace(ns: AnyNamespace, genId: number): void {
    const vertexIdx = this.vertexIndex();
    const byNs = vertexIdx.get(genId);
    const tags = byNs?.get(ns);
    if (!byNs || !tags) {
      return;
    }
    const slotsMap = this.slotsForLayout("gear:outer(vertex)");
    for (const tag of tags) {
      const key = getResCacheKey(ns, undefined, "gear:outer(vertex)", buildVertexKey(genId, tag));
      this.disposeSlotIn(slotsMap, key);
    }
    byNs.delete(ns);
    if (byNs.size === 0) {
      vertexIdx.delete(genId);
    }
  }

  disposeAllVertexSlotsByGenId(genId: number): number {
    const vertexIdx = this.vertexIndex();
    const byNs = vertexIdx.get(genId);
    if (!byNs) {
      return 0;
    }
    let count = 0;
    const slotsMap = this.slotsForLayout("gear:outer(vertex)");
    for (const [ns, tags] of byNs) {
      for (const tag of tags) {
        const key = getResCacheKey(ns, undefined, "gear:outer(vertex)", buildVertexKey(genId, tag));
        this.disposeSlotIn(slotsMap, key);
        count++;
      }
    }
    vertexIdx.delete(genId);
    return count;
  }

  disposeVertexSlotsByOwnershipChange(genId: number, newVertexGearMap: VertexGearMap | undefined): void {
    const byNs = this.vertexIndex().get(genId);
    if (!byNs) {
      return;
    }
    // Copy namespace iteration source: disposeVertexSlotsForNamespace mutates
    // `byNs` by deleting entries it disposes.
    for (const ns of [...byNs.keys()]) {
      if (newVertexGearMap?.[ns] !== undefined) {
        this.disposeVertexSlotsForNamespace(ns, genId);
      }
    }
  }

  // Tears down all OuterGear slots that were resolved within this scope, in
  // reverse-topological order (dependents first). Used by adapter packages at
  // end of request to free per-request state (cells, setInterval handles,
  // listeners) while leaving the process-tier slots (Base/Inner/Shell)
  // untouched. Errors in individual teardowns are caught and logged so one
  // broken teardown doesn't abort the rest.
  disposeRequestScope(scope: RequestScope): void {
    // Collect all root namespaces present in the scope's Outer + Vertex maps.
    const roots = new Set<AnyNamespace>();
    for (const slot of scope.outerSlots.values()) {
      roots.add(slot.namespace);
    }
    for (const slot of scope.vertexSlots.values()) {
      roots.add(slot.namespace);
    }
    if (roots.size === 0) {
      return;
    }

    // Union of reverse closures preserving dispose-safe order. Set insertion
    // order is preserved; for a dependent that appears in multiple closures
    // its first encountered position wins — which already satisfies its own
    // topological constraint relative to its dependencies.
    const ordered = new Set<AnyNamespace>();
    for (const root of roots) {
      const closure = this.blueprintManager.getReverseClosure(root);
      for (const n of closure) {
        ordered.add(n);
      }
    }

    // Bucket scope slot keys by namespace once.
    const keysByNs = new Map<AnyNamespace, Array<{ key: string; map: Map<string, Slot> }>>();
    const bucket = (slot: Slot, map: Map<string, Slot>): void => {
      let arr = keysByNs.get(slot.namespace);
      if (!arr) {
        arr = [];
        keysByNs.set(slot.namespace, arr);
      }
      arr.push({ key: slot.key, map });
    };
    for (const slot of scope.outerSlots.values()) {
      bucket(slot, scope.outerSlots);
    }
    for (const slot of scope.vertexSlots.values()) {
      bucket(slot, scope.vertexSlots);
    }

    for (const n of ordered) {
      const arr = keysByNs.get(n);
      if (!arr) {
        continue;
      }
      for (const { key, map } of arr) {
        try {
          this.disposeSlotIn(map, key);
        } catch (e) {
          console.error("[r-machine] disposeRequestScope error for", n, e);
        }
      }
    }
    scope.vertexSlotsByGenId.clear();
    scope.wireCachesByPlugId.clear();
    this.busHost.bus?.emit({ type: "res:requestScopeDisposed" });
  }
}
