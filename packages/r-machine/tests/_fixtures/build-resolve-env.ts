/**
 * Shared test harness: build a real BlueprintManager + ResManager +
 * WireManager wired exactly like RMachine does (one shared CassetteRecorder
 * per environment), driven by an in-memory module map.
 *
 * Generalizes the per-file `buildEnv` first written in
 * outer-gear-blueprint-phase1.test.ts so inner / base / shell / outer composer
 * suites can all resolve resources through the full stack without reinventing
 * the wiring. Module factories receive `(rm, recorder)` and return an
 * `AnyResModule`; use the family helpers below to build one via the PUBLIC
 * composer + a connector that dispatches back into `rm.getPlugin`.
 */
import { createBaseGearComposer } from "../../src/core/base-gear-composer.js";
import { BlueprintManager } from "../../src/core/blueprint-manager.js";
import { type CassetteRecorder, createCassetteRecorder } from "../../src/core/cassette-recorder.js";
import type { BusHost } from "../../src/core/event-bus.js";
import { createInnerGearComposer } from "../../src/core/inner-gear-composer.js";
import { createOuterGearComposer } from "../../src/core/outer-gear-composer.js";
import type { AnyRes } from "../../src/core/res.js";
import type { ResComposerConnector } from "../../src/core/res-composer-connector.js";
import type { AnyNamespace } from "../../src/core/res-domain.js";
import type { AnyResEquipment } from "../../src/core/res-equipment.js";
import { type AnyResLayout, ResLayoutResolver } from "../../src/core/res-layout.js";
import { ResManager } from "../../src/core/res-manager.js";
import type { AnyResModule, ResModuleLoaderFnOptions } from "../../src/core/res-module.js";
import type { ResPod } from "../../src/core/res-pod.js";
import { createShellComposer } from "../../src/core/shell-composer.js";
import { WireManager } from "../../src/core/wire-manager.js";

export type ModuleFactory = (rm: ResManager, recorder: CassetteRecorder) => AnyResModule;

export interface ResolveEnv {
  readonly rm: ResManager;
  readonly wm: WireManager;
  readonly recorder: CassetteRecorder;
  /** Resolve a namespace through the real ResManager and return its Surface. */
  resolve(ns: AnyNamespace, locale?: string): Promise<AnyRes>;
}

export interface BuildResolveEnvOptions {
  /** Override the equipment (kit maps / bridgeGears). Defaults to empty kits. */
  readonly equipment?: Partial<AnyResEquipment>;
}

/**
 * Spin up BM + RM + WM for the given layout and module map. Shell vs gear
 * namespaces are partitioned automatically from the layout so shells get full
 * per-locale handling.
 */
export function buildResolveEnv(
  layout: AnyResLayout,
  modules: Record<string, ModuleFactory>,
  options: BuildResolveEnvOptions = {}
): ResolveEnv {
  let rm!: ResManager;
  const recorder = createCassetteRecorder();

  const loader = async (_p: string, opts?: ResModuleLoaderFnOptions): Promise<AnyResModule> => {
    if (!opts) {
      throw new Error("expected ResModuleLoaderFnOptions");
    }
    const factory = modules[opts.namespace];
    if (!factory) {
      throw new Error(`No module registered for "${opts.namespace}"`);
    }
    return factory(rm, recorder);
  };

  const resolver = new ResLayoutResolver(layout);
  const allNs = Object.keys(modules) as AnyNamespace[];
  const gearNs: AnyNamespace[] = [];
  const shellNs: AnyNamespace[] = [];
  for (const ns of allNs) {
    (resolver.resolveLayoutEntryType(ns).startsWith("shell") ? shellNs : gearNs).push(ns);
  }

  const equipment: AnyResEquipment = {
    gearKit: {},
    shellKit: {},
    bridgeGears: [],
    ...options.equipment,
  };
  const busHost: BusHost = { bus: undefined };
  const bm = new BlueprintManager(resolver, loader, { gear: gearNs, shell: shellNs }, [], busHost);
  rm = new ResManager(resolver, equipment, bm, busHost);
  const wm = new WireManager(rm, busHost, recorder);

  const rmInternal = rm as unknown as {
    getPod(
      ns: AnyNamespace,
      locale: string | undefined,
      genId: number,
      vgm: undefined,
      chain: readonly AnyNamespace[]
    ): Promise<ResPod>;
  };

  const resolve = async (ns: AnyNamespace, locale?: string): Promise<AnyRes> => {
    const pod = await rmInternal.getPod(ns, locale, 0, undefined, []);
    return pod.surface;
  };

  return { rm, wm, recorder, resolve };
}

/**
 * Connector that dispatches `getWire` back into the live ResManager, so the
 * plugin assembled for the factory has the exact shape RMachine produces
 * (`{ ...kit, ...deps, $ }` for map mode, `[...deps, $]` for list mode). `kit`
 * mirrors RMachine wiring it from `equipment.gearKit` / `equipment.shellKit`.
 */
export function makeConnector(rm: ResManager, kit: Record<string, AnyNamespace> = {}): ResComposerConnector {
  return {
    getWire: async (nsDeps, locale, augmentCtx, chain) => {
      const plugin = await rm.getPlugin(kit, nsDeps, locale, augmentCtx, chain, 0, undefined);
      return { plugin };
    },
  };
}

// --- family module builders --------------------------------------------------
// Each takes a `build` callback that receives the PUBLIC composer and returns a
// matrix (or a cloned matrix). Generics are intentionally `any` — these are
// runtime fixtures; type-level contracts are exercised in the *.test-d.ts files.

type Kit = Record<string, AnyNamespace>;

export function innerGearModule(
  build: (composer: ReturnType<typeof createInnerGearComposer>) => unknown,
  kit: Kit = {}
): ModuleFactory {
  return (rm) => {
    const composer = createInnerGearComposer<any, any>(makeConnector(rm, kit));
    return { r: build(composer) as unknown as AnyRes };
  };
}

export function baseGearModule(
  build: (composer: ReturnType<typeof createBaseGearComposer>) => unknown,
  kit: Kit = {}
): ModuleFactory {
  return (rm) => {
    const composer = createBaseGearComposer<any, any>(makeConnector(rm, kit));
    return { r: build(composer) as unknown as AnyRes };
  };
}

export function shellModule(
  build: (composer: ReturnType<typeof createShellComposer>) => unknown,
  kit: Kit = {}
): ModuleFactory {
  return (rm) => {
    const composer = createShellComposer<any, any, any, any>(makeConnector(rm, kit));
    return { r: build(composer) as unknown as AnyRes };
  };
}

export function outerGearModule(
  build: (composer: ReturnType<typeof createOuterGearComposer>) => unknown,
  kit: Kit = {}
): ModuleFactory {
  return (rm, recorder) => {
    const composer = createOuterGearComposer<any, any>(makeConnector(rm, kit), recorder);
    return { r: build(composer) as unknown as AnyRes };
  };
}
