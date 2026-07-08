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
  type AnyNamespaceMap,
  type AnyPlugHead,
  type AnyResAtlas,
  type AnyResAtlasClass,
  type AnyResEquipment,
  ASYNC,
  type BaseGearNamespaceList,
  BlueprintManager,
  BUS_ACCESSOR,
  type BusHost,
  type CassetteRecorder,
  COVERED_PENDING,
  createBaseGearComposer,
  createCassetteRecorder,
  createEventBus,
  createInnerGearComposer,
  createOuterGearComposer,
  createPerLocale,
  createPlug,
  createShellComposer,
  type DirectPlugDefiner,
  type DirectPlugKitMap,
  type ExperimentalFlags,
  type GearPlugKitMap,
  getNamespaceList,
  getNamespaceMap,
  getPlugOutline,
  getPlugOverride,
  getResFamilyFromLayoutType,
  type HandleList,
  type HandleMap,
  type InternalEventBus,
  isDevEnv,
  type NamespaceList,
  type NamespaceMap,
  PLUG_MACHINE_ACCESSOR,
  type PlugBody,
  type PluginCtxAugmenter,
  type PlugMachine,
  type RequestScope,
  type RequestScopeProvider,
  type ResComposerConnector,
  type ResEquipment,
  type ResLayoutEntryType,
  ResLayoutResolver,
  ResManager,
  type ShellPlugKitMap,
  setPlugMachine,
  TestMode,
  type VertexGearMap,
  type Wire,
  WireManager,
} from "#r-machine/core";
import { ERR_UNKNOWN_LOCALE, RMachineUsageError } from "#r-machine/errors";
import { type AnyLocale, type AnyLocaleList, getCanonicalUnicodeLocaleId, LocaleHelper } from "#r-machine/locale";
import { createBlueprintRelayOrderingProvider } from "../core/relay-ordering.js";
import type { AnyNamespace, NamespaceCollection } from "../core/res-domain.js";
import {
  CONFIG_ACCESSOR,
  convertRMachineConfigParamsToConfig,
  type RMachineConfig,
  type RMachineConfigParams,
  validateRMachineConfig,
} from "./r-machine-config.js";
import { localized, type RMachineToolset } from "./r-machine-toolset.js";

export class RMachine<
  RA extends AnyResAtlas,
  L extends AnyLocale,
  E extends AnyResEquipment<RA>,
  EF extends ExperimentalFlags,
> {
  protected constructor(protected readonly config: RMachineConfig<RA, L, E, EF>) {
    const configError = validateRMachineConfig(config);
    if (configError) {
      throw configError;
    }
    this.localeHelper = new LocaleHelper(this.config.locales, this.config.defaultLocale);

    this.resLayoutResolver = new ResLayoutResolver(this.config.layout);
    const resLayoutResolver = this.resLayoutResolver;
    // The directKit (DirectPlug consumer kit) holds base gears + shells. Split
    // its entries by family and fold them into the per-family kit-dep lists so
    // they preload deterministically as kit-mates, exactly like gearKit/shellKit.
    // BlueprintManager dedupes, so an entry shared with gearKit/shellKit is safe.
    const gearKitNs = Object.values(this.config.equipment.gearKit) as AnyNamespace[];
    const shellKitNs = Object.values(this.config.equipment.shellKit) as AnyNamespace[];
    const directKitNs = Object.values(this.config.equipment.directKit) as AnyNamespace[];
    const directKitByFamily = (family: "gear" | "shell"): AnyNamespace[] =>
      directKitNs.filter((ns) => getResFamilyFromLayoutType(resLayoutResolver.resolveLayoutEntryType(ns)) === family);
    this.blueprintManager = new BlueprintManager(
      resLayoutResolver,
      this.config.loader.load,
      {
        gear: [...gearKitNs, ...directKitByFamily("gear")],
        shell: [...shellKitNs, ...directKitByFamily("shell")],
      },
      this.config.priority,
      this.busHost,
      // Bypass blueprint cache in dev: Node/Turbopack hot-reload their module
      // cache on file change, but our cached Blueprint still wraps the prior
      // factory closure, causing server SSR to render stale output and break
      // hydration. Cache stays on in production.
      isDevEnv()
    );
    this.resManager = new ResManager(resLayoutResolver, this.config.equipment, this.blueprintManager, this.busHost);
    this.cassetteRecorder = createCassetteRecorder(this.busHost);
    // Install the deterministic relay ordering provider (Step 2). The
    // recorder defaults to FIFO registration order when no provider is
    // set — used by tests and by the bare reactivity layer.
    this.cassetteRecorder.setRelayOrderingProvider(createBlueprintRelayOrderingProvider(this.blueprintManager));
    this.wireManager = new WireManager(this.resManager, this.busHost, this.cassetteRecorder);
  }

  readonly localeHelper: LocaleHelper<L>;
  protected readonly resLayoutResolver: ResLayoutResolver;
  protected readonly blueprintManager: BlueprintManager;
  protected readonly resManager: ResManager;
  protected readonly wireManager: WireManager;
  protected readonly cassetteRecorder!: CassetteRecorder;

  /**
   * Resolves a namespace to its layout entry type (`gear:outer`,
   * `gear:outer(vertex)`, `shell`, …). Sync — a layout-config lookup, no
   * blueprint load. Exposed for client toolsets that classify a resource by
   * kind: combine it with the exported `isVertexGearLayoutType` (per-consumer
   * wire instances) or `isOuterGearLayoutType` (React Compiler fresh-identity
   * wrapping) rather than adding a dedicated predicate here per question.
   */
  resolveLayoutEntryType(ns: AnyNamespace): ResLayoutEntryType {
    return this.resLayoutResolver.resolveLayoutEntryType(ns);
  }

  // Lazy: undefined until the first DevTools/test consumer attaches via
  // BUS_ACCESSOR. While undefined, manager call-sites `this.busHost.bus?.emit(...)`
  // short-circuit at zero cost — argument evaluation is skipped too.
  private readonly busHost: BusHost = {
    bus: undefined,
  };

  [BUS_ACCESSOR](): InternalEventBus {
    if (!this.busHost.bus) {
      (this.busHost as { bus: InternalEventBus }).bus = createEventBus();
    }
    return this.busHost.bus!;
  }

  [CONFIG_ACCESSOR](): RMachineConfig<RA, L, E, EF> {
    return this.config;
  }

  protected createResComposerConnector(kit: AnyNamespaceMap): ResComposerConnector {
    return {
      getWire: async (deps, locale, augmentCtx, chain) => {
        const plugin = await this.resManager.getPlugin(kit, deps, locale, augmentCtx, chain, 0, undefined);
        return {
          plugin,
        };
      },
      // Sync sibling (Tier B): assemble the dependency plugin synchronously when
      // every transitive dep is warm / sync-eligible; otherwise decline so the
      // caller falls back to the async `getWire`.
      getWireSync: (deps, locale, augmentCtx, chain) => {
        // No vertexGearMap here (gear→gear, genId 0) so COVERED_PENDING can't
        // occur; decline (→ async fallback) for both sentinels defensively.
        const plugin = this.resManager.getPluginSync(kit, deps, locale, augmentCtx, chain, 0, undefined);
        if (plugin === ASYNC || plugin === COVERED_PENDING) {
          return ASYNC;
        }
        return { plugin };
      },
      // Stamped onto every Plug built through this connector so test helpers can
      // reach `disposeResources()` from `r.plug` alone (`@r-machine/testing`).
      machine: this[PLUG_MACHINE_ACCESSOR],
      // Backs `res.perLocale(...)` dep loaders: single-shot, non-subscribing resolve of
      // one shell surface for a runtime-supplied locale (empty kit, no wire).
      // Mirrors the DirectPlug locale validation.
      resolveShell: async (shellNs, localeArg) => {
        const effLocale = getCanonicalUnicodeLocaleId(localeArg) as L;
        const error = this.localeHelper.validateLocale(effLocale);
        if (error) {
          throw new RMachineUsageError(
            ERR_UNKNOWN_LOCALE,
            `Cannot resolve shell "${shellNs}" for invalid locale: "${localeArg}".`,
            error
          );
        }
        const augmentCtx: PluginCtxAugmenter = ($) => {
          $.locale = effLocale;
        };
        const plugin = await this.resManager.getPlugin(
          {} as NamespaceMap<RA>,
          { shell: shellNs } as unknown as NamespaceCollection<RA>,
          effLocale,
          augmentCtx,
          [],
          0,
          undefined
        );
        return (plugin as { shell: unknown }).shell;
      },
    };
  }

  createToolset(): RMachineToolset<RA, L, E, EF> {
    const InnerGear = createInnerGearComposer<RA, E["gearKit"]>(
      this.createResComposerConnector(this.config.equipment.gearKit)
    );
    const BaseGear = createBaseGearComposer<RA, E["gearKit"]>(
      this.createResComposerConnector(this.config.equipment.gearKit)
    );
    const OuterGear =
      this.config.experimental.outerGear === "on"
        ? createOuterGearComposer<RA, E["gearKit"]>(
            this.createResComposerConnector(this.config.equipment.gearKit),
            this.cassetteRecorder
          )
        : undefined!;
    const Shell = createShellComposer<RA, L, E["bridgeGears"], E["shellKit"]>(
      this.createResComposerConnector(this.config.equipment.shellKit)
    );
    const DirectPlug = this.createDirectPlug();
    // `res` (derived-dependency builders) and `localized` are pure, atlas-typed
    // helpers (no machine state); exposed here so all resource/consumer tooling
    // comes from one place.
    const res = { perLocale: createPerLocale(this.localeHelper.locales) } as RMachineToolset<RA, L, E, EF>["res"];
    return { InnerGear, BaseGear, OuterGear, Shell, DirectPlug, localized, res };
  }

  // The container-free, framework-neutral consumer plug. Unlike ClientPlug
  // (bound to React context) or ServerPlug (bound to the Next request scope /
  // headers), it carries no locale container: the locale is passed explicitly
  // to `useR`, resolution is async, and it works anywhere — server components,
  // client handlers, queue workers, cron jobs, template renderers.
  // Deps are restricted to `valid@direct` (base gears + shells), exactly the
  // resources whose resolution is a pure function of locale.
  protected createDirectPlug(): DirectPlugDefiner<RA, L, E["directKit"]> {
    const directKit = this.config.equipment.directKit as NamespaceMap<RA>;
    const plugMachine = this[PLUG_MACHINE_ACCESSOR];

    const getValidLocale = (localeOption: AnyLocale): L => {
      const locale = getCanonicalUnicodeLocaleId(localeOption) as L;
      const error = this.localeHelper.validateLocale(locale);
      if (error) {
        throw new RMachineUsageError(
          ERR_UNKNOWN_LOCALE,
          `Cannot resolve DirectPlug for invalid locale: "${localeOption}".`,
          error
        );
      }
      return locale;
    };

    const DirectPlug = ((...args: unknown[]) => {
      const outline = getPlugOutline<AnyResAtlas>(...args);

      const isList = outline.mode === "list";
      const nsDeps = isList
        ? getNamespaceList(outline.deps as HandleList<AnyResAtlas>)
        : getNamespaceMap(outline.deps as HandleMap<AnyResAtlas>);

      const head = {
        realm: "gate",
        mode: outline.mode,
        deps: outline.deps,
        nsDeps,
        nsDepList: isList ? [...(nsDeps as NamespaceList<AnyResAtlas>)] : Object.values(nsDeps),
      };

      const body = createPlug(head as unknown as AnyPlugHead);
      // Stamp the owning RMachine so test helpers can reach it from the plug
      // alone (`mockPlug(plug)`), mirroring ServerPlug/createResMatrix.
      setPlugMachine(body, plugMachine);

      const useR = async (localeArg: AnyLocale): Promise<unknown> => {
        // DirectPlug's locale is ALWAYS explicit (it has no ambient container),
        // so the caller's `useR(locale)` wins. A DirectPlug mock therefore
        // exposes NO locale key at all (neither `$.locale` nor `$.ambientLocale`
        // — see `MockCtxContent`); mock a dependency instead. The mock's
        // `transform` still applies (via getGatePlugin).
        const effLocale = getValidLocale(localeArg);
        const augmentCtx: PluginCtxAugmenter = ($) => {
          $.locale = effLocale;
        };
        return this.getGatePlugin(directKit, nsDeps as NamespaceCollection<RA>, effLocale, augmentCtx, body);
      };

      (body as unknown as { useR: typeof useR }).useR = useR;
      return body;
    }) as DirectPlugDefiner<RA, L, E["directKit"]>;

    return DirectPlug;
  }

  getWire(
    kit: NamespaceMap<RA>,
    nsDeps: NamespaceCollection<RA>,
    locale: L,
    augmentCtx: PluginCtxAugmenter,
    vertexGearMap?: VertexGearMap | undefined,
    // The consuming Plug, when known. A consumer plug's own resolve is never
    // invoked at consume time, so `mockPlug` registers its override on the plug;
    // the wire reads it and applies the (post-resolution) `transform` on every
    // re-resolution. Undefined in production → zero overhead.
    plug?: PlugBody<AnyPlugHead>
  ): Wire {
    return this.wireManager.getWire(kit, nsDeps, locale, augmentCtx, vertexGearMap, plug);
  }

  // Single-shot plugin resolve. Unlike `getWire`, this does NOT subscribe
  // to the ResManager and creates no persistent wire — intended for
  // server-side / one-off resolution where reactivity is not needed.
  // Outer gear cannot be resolved through this method, as it relies on the wire's update mechanism to trigger re-resolution when outer gear changes.
  getGatePlugin(
    kit: NamespaceMap<RA>,
    nsDeps: NamespaceCollection<RA>,
    locale: L,
    augmentCtx: PluginCtxAugmenter,
    // The consuming Plug, when known — carries a `mockPlug` override whose
    // (post-resolution) `transform` is applied here. Undefined in production.
    plug?: PlugBody<AnyPlugHead>
  ): Promise<unknown> {
    const transform = plug !== undefined ? getPlugOverride(plug)?.transform : undefined;
    const promise = this.resManager.getPlugin(kit, nsDeps, locale, augmentCtx, [], 0, undefined);
    return transform !== undefined ? promise.then(transform) : promise;
  }

  readonly [PLUG_MACHINE_ACCESSOR]: PlugMachine = {
    // Dispose all resolved resources for this instance: tear down every
    // process-tier slot (running `Symbol.dispose`) and clear the resolution
    // caches, while KEEPING loaded blueprints (modules are not re-imported).
    // Primarily a test-isolation primitive — call it in `afterEach` so a stateful
    // OuterGear resolved (as a dependency or kit) in one test cannot leak into the
    // next. Request scopes are unaffected (use `requestScope.dispose`). Reachable
    // from a resource's `r.plug` via `getPlugMachine` (see `@r-machine/testing`).
    disposeResources: () => this.resManager.disposeResources(),
    // Per-instance test-mode controller. Toggled by `@r-machine/testing`'s
    // `mockPlug` (it reaches this via the Plug's `getPlugMachine` back-reference)
    // and read by the adapter guards off the `rMachine` they close over. Never
    // enabled in production (the testing package is never imported there). See
    // `TestMode`.
    testMode: new TestMode(),
  };

  readonly requestScope = {
    // Install a provider that RM consults to discover the active request scope
    // (e.g. an AsyncLocalStorage-backed lookup in @r-machine/next). Outer/Vertex
    // slot accesses route to the scope's maps when one is active; otherwise
    // they fall back to the process-tier slots. Adapter packages call this once
    // at toolset construction. Subsequent installs replace the previous provider
    // (single-adapter assumption).
    installProvider: (p: RequestScopeProvider): void => {
      this.resManager.setScopeProvider(p);
    },

    // Returns the currently installed provider (the no-op `PROCESS_SCOPE_PROVIDER`
    // by default). The React adapter uses this to discover the request-scoped
    // wireCache map on the server during SSR of client components.
    getProvider: (): RequestScopeProvider => {
      return this.resManager.getScopeProvider();
    },

    // Tears down all Outer-tier slots created within a request scope, in
    // dispose-safe order (dependents before dependencies). Invoked by adapter
    // packages at end of render (e.g. Next's `after()` callback in
    // `NextServerRMachine`). Errors are caught per-slot — one broken teardown
    // doesn't abort the rest.
    dispose: (scope: RequestScope): void => {
      this.resManager.disposeRequestScope(scope);
    },
  };

  // Invalidate a resource module previously delivered via the loader. `path`
  // is the same string the loader received as its first argument. Triggers
  // the standard HMR cascade: bus event → cache eviction → generation bump
  // → reactive notify. Hosts wire this into their bundler's HMR hook
  // (e.g. `import.meta.hot.accept` in Vite). Paths that were never loaded
  // are a no-op.
  reloadModule(path: string): void {
    this.blueprintManager.reloadModule(path);
  }

  // `RMachine.create` is intended to produce a single canonical instance per
  // (process, instanceName) pair. In environments where multiple module-loads
  // can occur within a single Node process — Next App Router bundles
  // `setup.ts` separately for middleware, server components, client component
  // SSR, etc. (Turbopack evaluates the same file once per bundle context) —
  // naive instantiation would yield distinct RMachine objects that don't
  // share RM state. This breaks request scoping (the install side and the
  // resolve side would reference different RMs) and any other singleton-by-
  // intent state.
  //
  // The fix: cache the instance on `globalThis` under a `Symbol.for` key
  // derived from the user-supplied `instanceName`. All bundle contexts in the
  // same Node process see the same instance. Browsers get their own
  // `globalThis`, so the client runtime instantiates its own copy — which is
  // correct (the browser is a separate runtime, no shared state with the
  // server). Vitest workers and other Node processes likewise get their own
  // instance — also correct (isolated test environments).
  //
  // To run multiple distinct RMachines in the same process (rare — e.g. a
  // monorepo that runs several apps in one Node, or test scenarios that need
  // parallel isolated instances), give each call a unique `instanceName`.
  static create<
    RAC extends AnyResAtlasClass,
    const LL extends AnyLocaleList,
    const BGL extends BaseGearNamespaceList<InstanceType<RAC>> = [],
    GK extends GearPlugKitMap<InstanceType<RAC>> = {},
    SK extends ShellPlugKitMap<InstanceType<RAC>, BGL> = {},
    DK extends DirectPlugKitMap<InstanceType<RAC>> = {},
    EF extends ExperimentalFlags = {},
  >(
    config: RMachineConfigParams<RAC, LL, BGL, GK, SK, DK, EF>
  ): RMachine<InstanceType<RAC>, LL[number], ResEquipment<InstanceType<RAC>, BGL, GK, SK, DK>, EF> {
    type Out = RMachine<InstanceType<RAC>, LL[number], ResEquipment<InstanceType<RAC>, BGL, GK, SK, DK>, EF>;
    const key = Symbol.for(`@r-machine/instance:${config.instanceName}`);
    const slot = globalThis as unknown as Record<symbol, Out | undefined>;
    const existing = slot[key];
    if (existing) {
      if (isDevEnv(true)) {
        // Next - HMR support
        existing.resManager.disposeResources();
      }

      return existing;
    }
    const created = new RMachine<InstanceType<RAC>, LL[number], ResEquipment<InstanceType<RAC>, BGL, GK, SK, DK>, EF>(
      convertRMachineConfigParamsToConfig(config)
    );
    slot[key] = created;
    return created;
  }
}

export type RMachineLocale<RM extends RMachine<any, any, any, any>> =
  RM extends RMachine<any, infer L, any, any> ? L : never;
