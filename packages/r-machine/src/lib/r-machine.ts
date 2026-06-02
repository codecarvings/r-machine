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
  type AnyResAtlas,
  type AnyResAtlasClass,
  type AnyResEquipment,
  type BaseGearNamespaceList,
  BlueprintManager,
  BUS_ACCESSOR,
  type BusHost,
  type CassetteRecorder,
  createBaseGearComposer,
  createCassetteRecorder,
  createEventBus,
  createInnerGearComposer,
  createOuterGearComposer,
  createShellComposer,
  type ExperimentalFlags,
  type GearPlugKitMap,
  type InternalEventBus,
  isVertexGearLayoutType,
  JunctureManager,
  type NamespaceMap,
  type PluginCtxAugmenter,
  type RequestScope,
  type RequestScopeProvider,
  type ResComposerConnector,
  type ResEquipment,
  ResLayoutResolver,
  type ShellPlugKitMap,
  type VertexGearMap,
  type Wire,
  WireManager,
} from "#r-machine/core";
import { type AnyLocale, type AnyLocaleList, LocaleHelper } from "#r-machine/locale";
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

// Ambient `process` is not in the package's type surface (no @types/node —
// r-machine is kept runtime-agnostic). Declare the slice we read so we can
// reference `process.env.NODE_ENV` and let consumer bundlers (Vite, webpack,
// Next/Turbopack) statically replace it at build time, while the `typeof`
// guard keeps it safe on the browser where bundlers don't replace.
declare const process: { env: { NODE_ENV?: string } } | undefined;

function isDevEnv(): boolean {
  return typeof process !== "undefined" && process.env.NODE_ENV !== "production";
}

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
    this.blueprintManager = new BlueprintManager(
      resLayoutResolver,
      this.config.load,
      {
        gear: Object.values(this.config.equipment.gearKit),
        shell: Object.values(this.config.equipment.shellKit),
      },
      this.config.priority,
      this.busHost,
      // Bypass blueprint cache in dev: Node/Turbopack hot-reload their module
      // cache on file change, but our cached Blueprint still wraps the prior
      // factory closure, causing server SSR to render stale output and break
      // hydration. Cache stays on in production.
      isDevEnv()
    );
    this.junctureManager = new JunctureManager(
      resLayoutResolver,
      this.config.equipment,
      this.blueprintManager,
      this.busHost
    );
    this.cassetteRecorder = createCassetteRecorder(this.busHost);
    // Install the deterministic relay ordering provider (Step 2). The
    // recorder defaults to FIFO registration order when no provider is
    // set — used by tests and by the bare reactivity layer.
    this.cassetteRecorder.setRelayOrderingProvider(createBlueprintRelayOrderingProvider(this.blueprintManager));
    this.wireManager = new WireManager(this.junctureManager, this.busHost, this.cassetteRecorder);

    // this.warnExperimental();
  }

  protected warnExperimental() {
    const display = (feature: string) =>
      console.warn(`R-Machine: ${feature} (experimental). API may change before stable release.`);

    if (this.config.experimental.outerGear === "on") {
      display("Outer Gear is enabled");
    }
  }

  readonly localeHelper: LocaleHelper<L>;
  protected readonly resLayoutResolver: ResLayoutResolver;
  protected readonly blueprintManager: BlueprintManager;
  protected readonly junctureManager: JunctureManager;
  protected readonly wireManager: WireManager;
  protected readonly cassetteRecorder!: CassetteRecorder;

  /**
   * Returns true when the namespace resolves to a vertex layout entry
   * (`gear:outer(vertex)`). Used by client toolsets to decide whether a Plug
   * needs per-consumer wire instances (each consumer is its own creator
   * unless a `VertexFrame` ancestor claims the namespace) or can share a
   * wire across consumers (the default for stateless / process-tier deps).
   */
  isVertexNamespace(ns: AnyNamespace): boolean {
    return isVertexGearLayoutType(this.resLayoutResolver.resolveLayoutEntryType(ns));
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
        const plugin = await this.junctureManager.getPlugin(kit, deps, locale, augmentCtx, chain, 0, undefined);
        return {
          plugin,
        };
      },
      // Stamped onto every Plug built through this connector so test helpers can
      // reach `disposeResources()` from `r.plug` alone (`@r-machine/testing`).
      machine: this,
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
    return { InnerGear, BaseGear, OuterGear, Shell, localized };
  }

  getWire(
    kit: NamespaceMap<RA>,
    nsDeps: NamespaceCollection<RA>,
    locale: L,
    augmentCtx: PluginCtxAugmenter,
    vertexGearMap?: VertexGearMap | undefined
  ): Wire {
    return this.wireManager.getWire(kit, nsDeps, locale, augmentCtx, vertexGearMap);
  }

  // Single-shot plugin resolve. Unlike `getWire`, this does NOT subscribe
  // to the JunctureManager and creates no persistent wire — intended for
  // server-side / one-off resolution where reactivity is not needed.
  // Outer gear cannot be resolved through this method, as it relies on the wire's update mechanism to trigger re-resolution when outer gear changes.
  getGatePlugin(
    kit: NamespaceMap<RA>,
    nsDeps: NamespaceCollection<RA>,
    locale: L,
    augmentCtx: PluginCtxAugmenter
  ): Promise<unknown> {
    return this.junctureManager.getPlugin(kit, nsDeps, locale, augmentCtx, [], 0, undefined);
  }

  readonly requestScope = {
    // Install a provider that JM consults to discover the active request scope
    // (e.g. an AsyncLocalStorage-backed lookup in @r-machine/next). Outer/Vertex
    // slot accesses route to the scope's maps when one is active; otherwise
    // they fall back to the process-tier slots. Adapter packages call this once
    // at toolset construction. Subsequent installs replace the previous provider
    // (single-adapter assumption).
    installProvider: (p: RequestScopeProvider): void => {
      this.junctureManager.setScopeProvider(p);
    },

    // Returns the currently installed provider (the no-op `PROCESS_SCOPE_PROVIDER`
    // by default). The React adapter uses this to discover the request-scoped
    // wireCache map on the server during SSR of client components.
    getProvider: (): RequestScopeProvider => {
      return this.junctureManager.getScopeProvider();
    },

    // Tears down all Outer-tier slots created within a request scope, in
    // dispose-safe order (dependents before dependencies). Invoked by adapter
    // packages at end of render (e.g. Next's `after()` callback in
    // `NextServerRMachine`). Errors are caught per-slot — one broken teardown
    // doesn't abort the rest.
    dispose: (scope: RequestScope): void => {
      this.junctureManager.disposeRequestScope(scope);
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

  // Dispose all resolved resources for this instance: tear down every
  // process-tier slot (running `Symbol.dispose`) and clear the resolution
  // caches, while KEEPING loaded blueprints (modules are not re-imported).
  // Primarily a test-isolation primitive — call it in `afterEach` so a stateful
  // OuterGear resolved (as a dependency or kit) in one test cannot leak into the
  // next. Request scopes are unaffected (use `requestScope.dispose`). Reachable
  // from a resource's `r.plug` via `getPlugMachine` (see `@r-machine/testing`).
  disposeResources(): void {
    this.junctureManager.disposeResources();
  }

  // `RMachine.create` is intended to produce a single canonical instance per
  // (process, instanceName) pair. In environments where multiple module-loads
  // can occur within a single Node process — Next App Router bundles
  // `setup.ts` separately for middleware, server components, client component
  // SSR, etc. (Turbopack evaluates the same file once per bundle context) —
  // naive instantiation would yield distinct RMachine objects that don't
  // share JM state. This breaks request scoping (the install side and the
  // resolve side would reference different JMs) and any other singleton-by-
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
    EF extends ExperimentalFlags = {},
  >(
    config: RMachineConfigParams<RAC, LL, BGL, GK, SK, EF>
  ): RMachine<InstanceType<RAC>, LL[number], ResEquipment<InstanceType<RAC>, BGL, GK, SK>, EF> {
    type Out = RMachine<InstanceType<RAC>, LL[number], ResEquipment<InstanceType<RAC>, BGL, GK, SK>, EF>;
    const key = Symbol.for(`@r-machine/instance:${config.instanceName}`);
    const slot = globalThis as unknown as Record<symbol, Out | undefined>;
    const existing = slot[key];
    if (existing) {
      return existing;
    }
    const created = new RMachine<InstanceType<RAC>, LL[number], ResEquipment<InstanceType<RAC>, BGL, GK, SK>, EF>(
      convertRMachineConfigParamsToConfig(config)
    );
    slot[key] = created;
    return created;
  }
}

export type RMachineLocale<RM extends RMachine<any, any, any, any>> =
  RM extends RMachine<any, infer L, any, any> ? L : never;
