/**
 * Copyright (c) 2026 Sergio Turolla
 *
 * This file is part of @r-machine/react, licensed under the
 * GNU Affero General Public License v3.0 (AGPL-3.0-only).
 *
 * You may use, modify, and distribute this file under the terms
 * of the AGPL-3.0. See LICENSE in this package for details.
 *
 * If you need to use this software in a proprietary project,
 * contact: licensing@codecarvings.com
 */

import type { AnyLocale } from "#r-machine/locale";
import type { NamespaceList, RList } from "./r-kit.js";
import type { NamespaceMap, RMap } from "./r-map.js";
import type { AnyResourceAtlas, Namespace } from "./resource-atlas.js";

// TODO: WIP;

// #region RMachineToolset

export interface RMachineToolset<RA extends AnyResourceAtlas, L extends AnyLocale, KA extends NamespaceMap<RA>> {
  readonly Gear: GearComposer<RA, L, KA>;
  readonly localized: LocalizerHelper<RA>;
}

type LocalizerHelper<RA extends AnyResourceAtlas> = <N extends Namespace<RA>, const R extends RA[N]>(
  namespace: N,
  shell: R
) => R;

// #endregion

// #region Plug

interface RMapPlug<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> {
  readonly use: () => RMapPlugHandle<RA, L, KA, NM>;
}
type AnyRMapPlug = RMapPlug<any, any, any, any>;

type RMapPlugHandle<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> = RMap<RA, Omit<NM, "$" | "_" | keyof KA>> & {
  readonly $: RCtx<RA, L, KA>;
  readonly _: RCursor;
} & RMap<RA, KA>;

interface RListPlug<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> {
  readonly use: () => RListPlugHandle<RA, L, KA, NL>;
}
type AnyRListPlug = RListPlug<any, any, any, any>;

type RListPlugHandle<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> = [...RList<RA, NL>, RCtx<RA, L, KA>, RCursor];

type AnyStandardPlug = AnyRListPlug | AnyRMapPlug;

type RCtx<RA extends AnyResourceAtlas, L extends AnyLocale, KA extends NamespaceMap<RA>> = {
  readonly locale: L;
} & (keyof KA extends never ? {} : { readonly kit: RMap<RA, KA> });

interface RCursor {
  readonly relay: RelayComposer;
  readonly cmd: CmdComposer;
  readonly resource: ResourceComposer;
}

// #endregion

// #region RReactivePlug

interface RReactiveMapPlug<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  S extends object,
> {
  readonly use: () => RReactiveMapPlugHandle<RA, L, KA, NM, S>;
}
type AnyRReactiveMapPlug = RReactiveMapPlug<any, any, any, any, any>;

type RReactiveMapPlugHandle<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  S extends object,
> = RMap<RA, Omit<NM, "$" | "_" | keyof KA>> & {
  readonly $: RReactiveCtx<RA, L, KA, S>;
  readonly _: RReactiveCursor<S>;
} & RMap<RA, KA>;

interface RReactiveListPlug<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  S extends object,
> {
  readonly use: () => RReactiveListPlugHandle<RA, L, KA, NL, S>;
}
type AnyRReactiveListPlug = RReactiveListPlug<any, any, any, any, any>;

type RReactiveListPlugHandle<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  S extends object,
> = [...RList<RA, NL>, RReactiveCtx<RA, L, KA, S>, RReactiveCursor<S>];

type AnyReactivePlug = AnyRReactiveMapPlug | AnyRReactiveListPlug;

type RReactiveCtx<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  S extends object,
> = RCtx<RA, L, KA> & {
  readonly state: S;
  readonly defaultState: S;
};

interface RReactiveCursor<S extends object> {
  readonly getter: GetterComposer<S>;
  readonly action: ActionComposer<S>;
  readonly relay: RelayComposer;
  readonly cmd: CmdComposer;
  readonly resource: ReactiveResourceComposer<S>;
}

// #endregion

// #region ResourcePackage

type AnyPlug = AnyStandardPlug | AnyReactivePlug;

interface ResourcePackage<RF extends AnyResourceFactory, P extends AnyPlug> {
  readonly r: RF;
  readonly plug: P;
}

// #endregion

// #region Gear

interface GearComposer<RA extends AnyResourceAtlas, L extends AnyLocale, KA extends NamespaceMap<RA>> {
  (): GearMapDefiner<RA, L, KA, {}>;
  <NL extends NamespaceList<RA>>(...namespaces: NL): GearListDefiner<RA, L, KA, NL>;
  <NM extends NamespaceMap<RA>>(namespaces: NM): GearMapDefiner<RA, L, KA, NM>;
}

interface GearMapDefiner<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> {
  readonly forge: <F extends AnyResourceFactory>(factory: F) => ResourcePackage<F, RMapPlug<RA, L, KA, NM>>;
  readonly reactive: ReactiveGearMapComposer<RA, L, KA, NM>;
  readonly scoped: GearDefiner<RMapPlug<RA, L, KA, NM>>;
}

interface GearListDefiner<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> {
  readonly forge: <F extends AnyResourceFactory>(factory: F) => ResourcePackage<F, RListPlug<RA, L, KA, NL>>;
  readonly reactive: ReactiveGearListComposer<RA, L, KA, NL>;
  readonly scoped: GearDefiner<RListPlug<RA, L, KA, NL>>;
}

interface ReactiveGearMapComposer<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> {
  <S extends object>(defaultState: () => Promise<S>): AsyncReactiveGearDefiner<RReactiveMapPlug<RA, L, KA, NM, S>>;
  <S extends object>(defaultState: () => S): ReactiveGearDefiner<RReactiveMapPlug<RA, L, KA, NM, S>>;
  <S extends object>(defaultState: S): ReactiveGearDefiner<RReactiveMapPlug<RA, L, KA, NM, S>>;
}

interface ReactiveGearListComposer<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> {
  <S extends object>(defaultState: () => Promise<S>): AsyncReactiveGearDefiner<RReactiveListPlug<RA, L, KA, NL, S>>;
  <S extends object>(defaultState: () => S): ReactiveGearDefiner<RReactiveListPlug<RA, L, KA, NL, S>>;
  <S extends object>(defaultState: S): ReactiveGearDefiner<RReactiveListPlug<RA, L, KA, NL, S>>;
}

interface AsyncReactiveGearDefiner<P extends AnyReactivePlug> {
  readonly forge: <F extends AnyResourceFactory>(factory: F) => Promise<ResourcePackage<F, P>>;
  readonly scoped: AsyncGearDefiner<P>;
}

interface AsyncGearDefiner<P extends AnyReactivePlug> {
  readonly forge: <F extends AnyResourceFactory>(factory: F) => Promise<ResourcePackage<F, P>>;
}

interface ReactiveGearDefiner<P extends AnyReactivePlug> {
  readonly forge: <F extends AnyResourceFactory>(factory: F) => ResourcePackage<F, P>;
  readonly scoped: GearDefiner<P>;
}

interface GearDefiner<P extends AnyPlug> {
  readonly forge: <F extends AnyResourceFactory>(factory: F) => ResourcePackage<F, P>;
}

// #endregion

// #region Getter

declare const getterBrand: unique symbol;
interface GetterBrand {
  readonly [getterBrand]: true;
}
type Getter<F extends () => any> = F & GetterBrand;

interface GetterComposer<S extends object> {
  (): Getter<() => S>;
  <GF extends () => any>(getter: GF): Getter<GF>;
}

// #endregion

// #region Action

type BuiltinAtomic =
  | Date
  | RegExp
  | Map<any, any>
  | Set<any>
  | ((...args: any[]) => any)
  | Promise<any>
  | Error
  | URL
  | URLSearchParams
  | ArrayBuffer
  | ArrayBufferView;

declare const atomicBrand: unique symbol;
export type Atomic = { readonly [atomicBrand]?: true };

type IsAtomic<T> = T extends BuiltinAtomic ? true : T extends Atomic ? true : false;

type DeepPartial<T> =
  IsAtomic<T> extends true
    ? T
    : T extends (infer I)[]
      ? DeepPartial<I>[]
      : T extends object
        ? { [K in keyof T]?: DeepPartial<T[K]> }
        : T;

declare const actionBrand: unique symbol;
interface ActionBrand {
  readonly [actionBrand]: true;
}
type Action<F extends (...args: any[]) => any> = F & ActionBrand;

interface ActionComposer<S extends object> {
  (): Action<(partialState: DeepPartial<S>) => S>;
  <A extends unknown[]>(reducer: (...args: A) => DeepPartial<S>): Action<(...args: A) => S>;
}

// #endregion

// #region Relay

// biome-ignore lint/suspicious/noConfusingVoidType: This is intentional
type RelayOnChangeResult = void | Cmd | Cmd[] | Promise<void | Cmd | Cmd[]>;

interface RelayConfig<T> {
  select: () => T;
  onChange: (current: T, prev: T) => RelayOnChangeResult | Promise<RelayOnChangeResult>;
}

declare const relayBrand: unique symbol;
interface RelayBrand {
  readonly [relayBrand]: true;
}
interface Relay<T> extends RelayConfig<T>, RelayBrand {}

type RelayComposer = <T>(config: RelayConfig<T>) => Relay<T>;

// #endregion

// #region Cmd

declare const cmdBrand: unique symbol;
interface Cmd {
  readonly [cmdBrand]: true;
  readonly name: string;
  readonly payload: any[];
}

type CmdComposer = <F extends (...args: any[]) => any>(action: Action<F>, ...args: Parameters<F>) => Cmd;

// #endregion

// #region Resource

type AnyResource = Record<string, unknown> & object;

type ResourceFactory<R extends AnyResource> = () => R | Promise<R>;
type AnyResourceFactory = ResourceFactory<AnyResource>;

type ResourceComposer = <R extends AnyResource>(resource: R, teardown?: () => void) => R;

type AnyReactiveResourceItem = ActionBrand | GetterBrand | RelayBrand | ((...args: any[]) => any);
interface AnyReactiveResource {
  readonly [key: string]: AnyReactiveResourceItem;
}
type ReactiveDefaultResource<S extends object, N extends string> = {
  [K in N]: Getter<() => S>;
} & {
  [K in `set${Capitalize<N>}`]: Action<(partialState: DeepPartial<S>) => S>;
};

interface ReactiveResourceComposer<S extends object> {
  <N extends string>(name: N): ReactiveDefaultResource<S, N>;
  <S extends AnyReactiveResource>(resource: S, teardown?: () => void): S;
}

// #endregion

// #region Surface

type RSurfaceItem<I> = I extends Getter<infer F> ? ReturnType<F> : I extends RelayBrand ? never : I;
export type RSurface<R extends AnyResource> = {
  readonly [K in keyof R as K extends `$${string}` ? never : K]: RSurfaceItem<R[K]>;
};

// #endregion

// #region ResourceAtlas

type AnyRForge = AnyResourceFactory | AnyResource;

type Resource<RF extends AnyRForge> = RF extends () => infer R ? (R extends Promise<infer R2> ? R2 : R) : RF;

// Re-exported from setup.ts as R
declare const rModuleBrand: unique symbol;
export type BrandedResource<RF extends AnyRForge> = Resource<RF> & {
  readonly [rModuleBrand]?: true;
};

/*
interface RModule<RF extends AnyRForge> {
  readonly r: RF;
}
type AnyRModule = RModule<AnyRForge>;

interface AnyRModuleMap {
  readonly [namespace: AnyNamespace]: AnyRModule;
}

export type ResourceAtlasOf<RA extends AnyRModuleMap> = {
  [N in Namespace<RA>]: PublicSurface<Resource<RA[N]["r"]>>;
};
*/

// #endregion
