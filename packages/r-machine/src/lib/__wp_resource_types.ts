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
  readonly ReactivePlug: ReactivePlugComposer<RA, L, KA>;
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
  readonly Gear: GearFactoryComposer;
  readonly ScopedGear: GearFactoryComposer;
  readonly Shell: ShellFactoryComposer;
  use(): BaseMapPlugPackage<RA, L, KA, NM>;
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
  readonly Gear: GearFactoryComposer;
  readonly ScopedGear: GearFactoryComposer;
  readonly Shell: ShellFactoryComposer;
  use(): BaseListPlugPackage<RA, L, KA, NL>;
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

// #region ReactivePlug

interface ReactivePlugComposer<RA extends AnyResourceAtlas, L extends AnyLocale, KA extends NamespaceMap<RA>> {
  (): ReactiveMapPlugComposer<RA, L, KA, {}>;
  <NL extends NamespaceList<RA>>(...namespaces: NL): ReactiveListPlugComposer<RA, L, KA, NL>;
  <NM extends NamespaceMap<RA>>(namespaces: NM): ReactiveMapPlugComposer<RA, L, KA, NM>;
}

interface ReactiveMapPlugComposer<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> {
  default<S extends object>(defaultState: () => Promise<S>): Promise<ReactiveMapPlug<RA, L, KA, NM, S>>;
  default<S extends object>(defaultState: () => S): ReactiveMapPlug<RA, L, KA, NM, S>;
  default<S extends object>(defaultState: S): ReactiveMapPlug<RA, L, KA, NM, S>;
}

interface ReactiveListPlugComposer<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> {
  default<S extends object>(defaultState: () => Promise<S>): Promise<ReactiveListPlug<RA, L, KA, NL, S>>;
  default<S extends object>(defaultState: () => S): ReactiveListPlug<RA, L, KA, NL, S>;
  default<S extends object>(defaultState: S): ReactiveListPlug<RA, L, KA, NL, S>;
}

interface ReactiveMapPlug<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  S extends object,
> {
  readonly Gear: ReactiveGearFactoryComposer<S>;
  readonly ScopedGear: ReactiveGearFactoryComposer<S>;
  use(): ReactiveMapPlugPackage<RA, L, KA, NM, S>;
}

type ReactiveMapPlugPackage<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  S extends object,
> = RMap<RA, Omit<NM, "$" | "_" | keyof KA>> & {
  readonly $: ReactivePlugCtx<RA, L, KA, S>;
  readonly _: ReactivePlugCursor<S>;
} & RMap<RA, KA>;

interface ReactiveListPlug<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  S extends object,
> {
  readonly Gear: ReactiveGearFactoryComposer<S>;
  readonly ScopedGear: ReactiveGearFactoryComposer<S>;
  use(): ReactiveListPlugPackage<RA, L, KA, NL, S>;
}

type ReactiveListPlugPackage<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  S extends object,
> = [...RList<RA, NL>, ReactivePlugCtx<RA, L, KA, S>, ReactivePlugCursor<S>];

type ReactivePlugCtx<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  S extends object,
> = BasePlugCtx<RA, L, KA> & {
  readonly state: S;
  readonly defaultState: S;
};

interface ReactivePlugCursor<S extends object> {
  readonly getter: GetterComposer<S>;
  readonly action: ActionComposer<S>;
  readonly relay: RelayComposer;
  readonly cmd: CmdComposer;
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

type AnyReactiveResourceItem = ActionBrand | GetterBrand | RelayBrand | ((...args: any[]) => any);
interface AnyReactiveResource {
  readonly [key: string]: AnyReactiveResourceItem;
}

declare const gearFactoryBrand: unique symbol;
interface GearFactoryBrand {
  readonly [gearFactoryBrand]: true;
}
type GearFactory<R extends AnyResource> = (() => R) & GearFactoryBrand;
type AnyGearFactory = GearFactory<AnyResource>;
type GearFactoryComposer = <R extends AnyResource>(factory: () => R | Promise<R>) => GearFactory<R>;

declare const reactiveGearFactoryBrand: unique symbol;
interface ReactiveGearFactoryBrand {
  readonly [reactiveGearFactoryBrand]: true;
}
type ReactiveGearFactory<R extends AnyReactiveResource> = (() => R) & ReactiveGearFactoryBrand;
type AnyReactiveGearFactory = ReactiveGearFactory<AnyReactiveResource>;

type DefaultROReactiveGearResource<S extends object, G extends string> = { readonly [P in G]: Getter<() => S> };
type DefaultRWReactiveGearResource<S extends object, G extends string, A extends string> = {
  readonly [P in G]: Getter<() => S>;
} & {
  readonly [P in A]: Action<(partialState: DeepPartial<S>) => S>;
};

interface ReactiveGearFactoryComposer<S extends object> {
  <const G extends string, const A extends string>(
    factory: () => readonly [G, A] | Promise<readonly [G, A]>
  ): ReactiveGearFactory<DefaultRWReactiveGearResource<S, G, A>>;
  <const G extends string>(
    factory: () => readonly [G] | Promise<readonly [G]>
  ): ReactiveGearFactory<DefaultROReactiveGearResource<S, G>>;
  <R extends AnyReactiveResource>(factory: () => R | Promise<R>): ReactiveGearFactory<R>;
}

declare const shellFactoryBrand: unique symbol;
interface ShellFactoryBrand {
  readonly [shellFactoryBrand]: true;
}
type ShellFactory<R extends AnyResource> = (() => R) & ShellFactoryBrand;
type AnyShellFactory = ShellFactory<AnyResource>;
type ShellFactoryComposer = <R extends AnyResource>(factory: () => R | Promise<R>) => ShellFactory<R>;

type AnyResourceFactory = AnyGearFactory | AnyReactiveGearFactory | AnyShellFactory;

type LocalizerHelper<RA extends AnyResourceAtlas> = <N extends Namespace<RA>, const R extends RA[N]>(
  namespace: N,
  shell: R
) => R;

// #endregion

// #region Surface

type RSurfaceItem<I> = I extends Getter<infer F> ? ReturnType<F> : I extends RelayBrand ? never : I;
export type RSurface<R extends AnyResource> = {
  readonly [K in keyof R as K extends `$${string}` ? never : K]: RSurfaceItem<R[K]>;
};

// #endregion

// #region ResourceAtlas

type AnyRForge = AnyResourceFactory | AnyResource;

// type Resource<RF extends AnyRForge> = RF extends () => infer R ? (R extends Promise<infer R2> ? R2 : R) : RF;
type Resource<RF extends AnyRForge> = RF extends () => infer R ? (R extends Promise<infer R2> ? R2 : R) : RF;

// Re-exported from setup.ts as R
declare const rModuleBrand: unique symbol;
export type BrandedResource<RF extends AnyRForge> = Resource<RF> & {
  readonly [rModuleBrand]?: true;
};

// #endregion
