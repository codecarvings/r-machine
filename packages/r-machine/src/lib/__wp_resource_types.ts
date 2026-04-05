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
  readonly BasePlug: BasePlugComposer<RA, L, KA>;
  readonly StatePlug: StatePlugComposer<RA, L, KA>;
  readonly Gear: GearFactoryComposer;
  readonly Shell: ShellFactoryComposer;
  readonly localized: LocalizerHelper<RA>;
}

// #endregion

// #region BasePlug

interface BasePlugComposer<RA extends AnyResourceAtlas, L extends AnyLocale, KA extends NamespaceMap<RA>> {
  (): BaseMapPlug<RA, L, KA, {}>;
  <NL extends NamespaceList<RA>>(...namespaces: NL): BaseListPlug<RA, L, KA, NL>;
  <NM extends NamespaceMap<RA>>(namespaces: NM): BaseMapPlug<RA, L, KA, NM>;
}

interface BaseMapPlug<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> {
  use(r: AnyResourceFactory): BaseMapPlugPackage<RA, L, KA, NM>;
}

type BaseMapPlugPackage<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> = RMap<RA, Omit<NM, "$" | "_" | keyof KA>> & {
  readonly $: BasePlugCtx<RA, L, KA>;
  readonly _: BasePlugCursor;
} & RMap<RA, KA>;

interface BaseListPlug<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> {
  use(r: AnyResourceFactory): BaseListPlugPackage<RA, L, KA, NL>;
}

type BaseListPlugPackage<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> = [...RList<RA, NL>, BasePlugCtx<RA, L, KA>, BasePlugCursor];

type BasePlugCtx<RA extends AnyResourceAtlas, L extends AnyLocale, KA extends NamespaceMap<RA>> = {
  readonly locale: L;
} & (keyof KA extends never ? {} : { readonly kit: RMap<RA, KA> });

interface BasePlugCursor {
  readonly relay: RelayComposer;
  readonly cmd: CmdComposer;
}

// #endregion

// #region StatePlug

interface StatePlugComposer<RA extends AnyResourceAtlas, L extends AnyLocale, KA extends NamespaceMap<RA>> {
  (): StateMapPlugComposer<RA, L, KA, {}>;
  <NL extends NamespaceList<RA>>(...namespaces: NL): StateListPlugComposer<RA, L, KA, NL>;
  <NM extends NamespaceMap<RA>>(namespaces: NM): StateMapPlugComposer<RA, L, KA, NM>;
}

interface StateMapPlugComposer<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> {
  default<S extends object>(defaultState: () => Promise<S>): Promise<StateMapPlug<RA, L, KA, NM, S>>;
  default<S extends object>(defaultState: () => S): StateMapPlug<RA, L, KA, NM, S>;
  default<S extends object>(defaultState: S): StateMapPlug<RA, L, KA, NM, S>;
}

interface StateListPlugComposer<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> {
  default<S extends object>(defaultState: () => Promise<S>): Promise<StateListPlug<RA, L, KA, NL, S>>;
  default<S extends object>(defaultState: () => S): StateListPlug<RA, L, KA, NL, S>;
  default<S extends object>(defaultState: S): StateListPlug<RA, L, KA, NL, S>;
}

interface StateMapPlug<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  S extends object,
> {
  use(r: AnyGearFactory): StateMapPlugPackage<RA, L, KA, NM, S>;
}

type StateMapPlugPackage<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  S extends object,
> = RMap<RA, Omit<NM, "$" | "_" | keyof KA>> & {
  readonly $: StatePlugCtx<RA, L, KA, S>;
  readonly _: StatePlugCursor<S>;
} & RMap<RA, KA>;

interface StateListPlug<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  S extends object,
> {
  use(r: AnyGearFactory): StateListPlugPackage<RA, L, KA, NL, S>;
}

type StateListPlugPackage<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  S extends object,
> = [...RList<RA, NL>, StatePlugCtx<RA, L, KA, S>, StatePlugCursor<S>];

type StatePlugCtx<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  S extends object,
> = BasePlugCtx<RA, L, KA> & {
  readonly state: S;
  readonly defaultState: S;
};

interface StatePlugCursor<S extends object> {
  readonly getter: GetterComposer<S>;
  readonly action: ActionComposer<S>;
  readonly relay: RelayComposer;
  readonly cmd: CmdComposer;
  readonly resource: ReactiveResourceComposer<S>;
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

// #region Reactive

type ReactiveDefaultResource<S extends object, N extends string> = {
  [K in N]: Getter<() => S>;
} & {
  [K in `set${Capitalize<N>}`]: Action<(partialState: DeepPartial<S>) => S>;
};

interface ReactiveResourceComposer<S extends object> {
  <N extends string>(name: N): ReactiveDefaultResource<S, N>;
  <R extends AnyReactiveResource>(resource: R): R;
}

// #endregion

// #region Resource

type AnyResource = Record<string, unknown> & object;

type AnyReactiveResourceItem = ActionBrand | GetterBrand | RelayBrand | ((...args: any[]) => any);
interface AnyReactiveResource {
  readonly [key: string]: AnyReactiveResourceItem;
}

type RawResourceFactory<R extends AnyResource> = () => R | Promise<R>;
type AnyRawResourceFactory = RawResourceFactory<AnyResource>;

declare const gearFactoryBrand: unique symbol;
interface GearFactoryBrand {
  readonly [gearFactoryBrand]: true;
}
type GearFactory<RF extends AnyRawResourceFactory> = RF & GearFactoryBrand;
type AnyGearFactory = GearFactory<AnyRawResourceFactory>;
interface GearFactoryComposer {
  <RF extends AnyRawResourceFactory>(factory: RF): GearFactory<RF>;
  <RF extends AnyRawResourceFactory>(scoped: "scoped", factory: RF): GearFactory<RF>;
}

declare const shellFactoryBrand: unique symbol;
interface ShellFactoryBrand {
  readonly [shellFactoryBrand]: true;
}
type ShellFactory<RF extends AnyRawResourceFactory> = RF & ShellFactoryBrand;
type AnyShellFactory = ShellFactory<AnyRawResourceFactory>;
type ShellFactoryComposer = <RF extends AnyRawResourceFactory>(factory: RF) => ShellFactory<RF>;

type AnyResourceFactory = AnyGearFactory | AnyShellFactory;

type LocalizerHelper<RA extends AnyResourceAtlas> = <N extends Namespace<RA>, const R extends RA[N]>(
  namespace: N,
  shell: R
) => R;

// type AnyReactiveResourceFactory = () => AnyReactiveResource;

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

// #endregion
