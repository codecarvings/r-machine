import { describe, expectTypeOf, it } from "vitest";
import type {
  Action,
  AnyClientGearSurface,
  AnyListPlugHead,
  AnyMapPlugHead,
  AnyNamespace,
  AnyNamespaceMap,
  AnyPlugHead,
  AnyRes,
  AnyResAtlas,
  AnyResAtlasClass,
  AnyResDomain,
  AnyResEquipment,
  AnyResLayout,
  AnyResModule,
  AnyResOrigin,
  BaseGearComposer,
  BaseGearNamespaceList,
  BusBridge,
  BusHost,
  CassetteRecorder,
  DeepPartial,
  DirectPlugDefiner,
  DirectPlugKitMap,
  ExperimentalFlags,
  ExtractCtx,
  ExtractKit,
  ExtractNamespace,
  ExtractResAtlas,
  ExtractState,
  GateListPlugHead,
  GateMapPlugHead,
  GatePluginCtx,
  GearPlugKitMap,
  Getter,
  Handle,
  HandleList,
  HandleMap,
  InnerGearComposer,
  InternalEvent,
  InternalEventBus,
  ListPlugin,
  MapPlugin,
  Namespace,
  NamespaceCollection,
  NamespaceList,
  NamespaceMap,
  OuterGearComposer,
  PlugBody,
  PluginCtxAugmenter,
  PlugMachine,
  PlugMachineBridge,
  PlugResolve,
  RelayBrand,
  RequestScope,
  RequestScopeProvider,
  ResAtlasClass,
  ResComposerConnector,
  ResEquipment,
  ResLayoutEntryType,
  ResMatrix,
  ResModuleLoaderFn,
  ResModuleLoaderFnOptions,
  RState,
  RuntimeAction,
  ShellComposer,
  ShellPlugKitMap,
  StateCell,
  StatefulOuterStateMap,
  SwitchableOption,
  Token,
  ValidatedDepListType,
  ValidatedDepMapType,
  VertexGearMap,
  VertexGearTagData,
  Wire,
} from "../../src/core/index.js";
import {
  ASYNC,
  BlueprintManager,
  BUS_ACCESSOR,
  buildVertexKey,
  COVERED_PENDING,
  createBaseGearComposer,
  createCassetteRecorder,
  createEventBus,
  createInnerGearComposer,
  createOuterGearComposer,
  createPlug,
  createRequestScope,
  createShellComposer,
  createToken,
  deepPartialMerge,
  fulfilledThenable,
  getNamespaceList,
  getNamespaceMap,
  getPlugHead,
  getPlugId,
  getPlugMachine,
  getPlugOutline,
  getPlugOverride,
  getPlugResolve,
  getResFamilyFromLayoutType,
  isDevEnv,
  isOuterGearLayoutType,
  isVertexGearLayoutType,
  PLUG_MACHINE_ACCESSOR,
  PROCESS_SCOPE_PROVIDER,
  ResLayoutResolver,
  ResManager,
  setPlugMachine,
  setPlugOverride,
  setPlugResolve,
  TestMode,
  tryGetStateAccess,
  tryGetVertexGearTag,
  validateResModule,
  WireManager,
} from "../../src/core/index.js";

// Barrel test: verifies export completeness only — every name re-exported by the
// core barrel is imported and referenced here, so dropping any export breaks this
// file. Deep type-shape behavior lives in the dedicated per-symbol *.test-d.ts
// files (plug, res-domain, outer-gear-composer, direct-plug, …).
describe("core barrel exports", () => {
  it("exports all expected runtime symbols", () => {
    // Functions
    expectTypeOf(createBaseGearComposer).toBeFunction();
    expectTypeOf(createCassetteRecorder).toBeFunction();
    expectTypeOf(deepPartialMerge).toBeFunction();
    expectTypeOf(isDevEnv).toBeFunction();
    expectTypeOf(createEventBus).toBeFunction();
    expectTypeOf(createInnerGearComposer).toBeFunction();
    expectTypeOf(createOuterGearComposer).toBeFunction();
    expectTypeOf(createPlug).toBeFunction();
    expectTypeOf(getPlugHead).toBeFunction();
    expectTypeOf(getPlugId).toBeFunction();
    expectTypeOf(getPlugMachine).toBeFunction();
    expectTypeOf(getPlugOutline).toBeFunction();
    expectTypeOf(getPlugOverride).toBeFunction();
    expectTypeOf(getPlugResolve).toBeFunction();
    expectTypeOf(setPlugMachine).toBeFunction();
    expectTypeOf(setPlugOverride).toBeFunction();
    expectTypeOf(setPlugResolve).toBeFunction();
    expectTypeOf(createToken).toBeFunction();
    expectTypeOf(getResFamilyFromLayoutType).toBeFunction();
    expectTypeOf(isOuterGearLayoutType).toBeFunction();
    expectTypeOf(isVertexGearLayoutType).toBeFunction();
    expectTypeOf(getNamespaceList).toBeFunction();
    expectTypeOf(getNamespaceMap).toBeFunction();
    expectTypeOf(validateResModule).toBeFunction();
    expectTypeOf(createRequestScope).toBeFunction();
    expectTypeOf(createShellComposer).toBeFunction();
    expectTypeOf(tryGetStateAccess).toBeFunction();
    expectTypeOf(fulfilledThenable).toBeFunction();
    expectTypeOf(buildVertexKey).toBeFunction();
    expectTypeOf(tryGetVertexGearTag).toBeFunction();

    // Classes
    expectTypeOf(BlueprintManager).toBeObject();
    expectTypeOf(ResLayoutResolver).toBeObject();
    expectTypeOf(ResManager).toBeObject();
    expectTypeOf(TestMode).toBeObject();
    expectTypeOf(WireManager).toBeObject();

    // Symbols
    expectTypeOf(BUS_ACCESSOR).toBeSymbol();
    expectTypeOf(PLUG_MACHINE_ACCESSOR).toBeSymbol();
    expectTypeOf(ASYNC).toBeSymbol();
    expectTypeOf(COVERED_PENDING).toBeSymbol();

    // Object constants
    expectTypeOf(PROCESS_SCOPE_PROVIDER).toBeObject();
  });

  it("exports all expected type aliases", () => {
    expectTypeOf<Action<(x: number) => number>>().not.toBeNever();
    expectTypeOf<RuntimeAction<(x: number) => number>>().not.toBeNever();
    expectTypeOf<BaseGearComposer<any, any>>().not.toBeNever();
    expectTypeOf<BaseGearNamespaceList<any>>().not.toBeNever();
    expectTypeOf<CassetteRecorder>().not.toBeNever();
    expectTypeOf<SwitchableOption>().not.toBeNever();
    expectTypeOf<DeepPartial<{ a: number }>>().not.toBeNever();
    expectTypeOf<DirectPlugDefiner<any, any, any>>().not.toBeNever();
    expectTypeOf<DirectPlugKitMap<any>>().not.toBeNever();
    expectTypeOf<BusBridge>().not.toBeNever();
    expectTypeOf<BusHost>().not.toBeNever();
    expectTypeOf<InternalEvent>().not.toBeNever();
    expectTypeOf<InternalEventBus>().not.toBeNever();
    expectTypeOf<ExperimentalFlags>().not.toBeNever();
    expectTypeOf<GateListPlugHead<any, any, any, any, any>>().not.toBeNever();
    expectTypeOf<GateMapPlugHead<any, any, any, any, any>>().not.toBeNever();
    expectTypeOf<GatePluginCtx<any, any, any>>().not.toBeNever();
    expectTypeOf<GearPlugKitMap<any>>().not.toBeNever();
    expectTypeOf<Getter<number>>().not.toBeNever();
    expectTypeOf<InnerGearComposer<any, any>>().not.toBeNever();
    expectTypeOf<OuterGearComposer<any, any>>().not.toBeNever();
    expectTypeOf<AnyListPlugHead>().not.toBeNever();
    expectTypeOf<AnyMapPlugHead>().not.toBeNever();
    expectTypeOf<AnyPlugHead>().not.toBeNever();
    expectTypeOf<ExtractCtx<any>>().not.toBeNever();
    expectTypeOf<ExtractKit<any>>().not.toBeNever();
    expectTypeOf<ExtractResAtlas<any>>().not.toBeNever();
    expectTypeOf<ExtractState<any>>().not.toBeNever();
    expectTypeOf<ListPlugin<any, any, any>>().not.toBeNever();
    expectTypeOf<MapPlugin<any, any, any>>().not.toBeNever();
    expectTypeOf<PlugBody<any>>().not.toBeNever();
    expectTypeOf<PluginCtxAugmenter>().not.toBeNever();
    expectTypeOf<PlugMachine>().not.toBeNever();
    expectTypeOf<PlugMachineBridge>().not.toBeNever();
    expectTypeOf<PlugResolve<any>>().not.toBeNever();
    expectTypeOf<RelayBrand>().not.toBeNever();
    expectTypeOf<AnyRes>().not.toBeNever();
    expectTypeOf<AnyResOrigin>().not.toBeNever();
    expectTypeOf<AnyResAtlas>().not.toBeNever();
    expectTypeOf<AnyResAtlasClass>().not.toBeNever();
    expectTypeOf<ResAtlasClass<any, any>>().not.toBeNever();
    expectTypeOf<ResComposerConnector>().not.toBeNever();
    expectTypeOf<Handle<any>>().not.toBeNever();
    expectTypeOf<NamespaceCollection<any>>().not.toBeNever();
    expectTypeOf<AnyNamespace>().not.toBeNever();
    expectTypeOf<AnyResDomain>().not.toBeNever();
    expectTypeOf<ExtractNamespace<any>>().not.toBeNever();
    expectTypeOf<Namespace<any>>().not.toBeNever();
    expectTypeOf<Token<string>>().not.toBeNever();
    expectTypeOf<AnyResEquipment>().not.toBeNever();
    expectTypeOf<ResEquipment<any>>().not.toBeNever();
    expectTypeOf<AnyResLayout>().not.toBeNever();
    expectTypeOf<ResLayoutEntryType>().not.toBeNever();
    expectTypeOf<HandleList<any>>().not.toBeNever();
    expectTypeOf<NamespaceList<any>>().not.toBeNever();
    expectTypeOf<ValidatedDepListType<any, any>>().not.toBeNever();
    expectTypeOf<AnyNamespaceMap>().not.toBeNever();
    expectTypeOf<HandleMap<any>>().not.toBeNever();
    expectTypeOf<NamespaceMap<any>>().not.toBeNever();
    expectTypeOf<ValidatedDepMapType<any, any>>().not.toBeNever();
    expectTypeOf<ResMatrix<any, any>>().not.toBeNever();
    expectTypeOf<AnyResModule>().not.toBeNever();
    expectTypeOf<ResModuleLoaderFn>().not.toBeNever();
    expectTypeOf<ResModuleLoaderFnOptions>().not.toBeNever();
    expectTypeOf<RequestScope>().not.toBeNever();
    expectTypeOf<RequestScopeProvider>().not.toBeNever();
    expectTypeOf<ShellComposer<any, any, any, any>>().not.toBeNever();
    expectTypeOf<ShellPlugKitMap<any>>().not.toBeNever();
    expectTypeOf<RState<number>>().not.toBeNever();
    expectTypeOf<StatefulOuterStateMap<any>>().not.toBeNever();
    expectTypeOf<StateCell<number>>().not.toBeNever();
    expectTypeOf<AnyClientGearSurface>().not.toBeNever();
    expectTypeOf<VertexGearMap>().not.toBeNever();
    expectTypeOf<VertexGearTagData>().not.toBeNever();
    expectTypeOf<Wire>().not.toBeNever();
  });
});
