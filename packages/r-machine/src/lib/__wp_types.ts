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

import type { AnyNamespace } from "#r-machine";
import type { AnyLocale } from "#r-machine/locale";
import type { NamespaceList, RList } from "./r-kit.js";
import type { NamespaceMap, RMap } from "./r-map.js";
import type { AnyResourceAtlas, Namespace } from "./resource-atlas.js";

// TODO: WIP;

// #region RMachineToolset

export interface RMachineToolset<RA extends AnyResourceAtlas, L extends AnyLocale, KA extends NamespaceMap<RA>> {
  readonly RPlug: RPlugComposer<RA, L, KA>;
  readonly gear: GearFactory;
  readonly shell: ShellFactory;
  readonly localized: LocalizerHelper<RA>;
}

interface GearFactory {
  <SF extends AnySurfaceFactory>(gearFactory: SF): SF;
  <SF extends AnySurfaceFactory>(scoped: "scoped", gearFactory: SF): SF;
}

type ShellFactory = <SF extends AnySurfaceFactory>(shellFactory: SF) => SF;

type LocalizerHelper<RA extends AnyResourceAtlas> = <N extends Namespace<RA>, const R extends RA[N]>(
  namespace: N,
  shell: R
) => R;

// #endregion

// #region RPlug

interface RPlugComposer<RA extends AnyResourceAtlas, L extends AnyLocale, KA extends NamespaceMap<RA>> {
  readonly connect: RPlugConnector<RA, L, KA>;
  readonly reactive: RReactivePlug<RA, L, KA>;
}

interface RPlugConnector<RA extends AnyResourceAtlas, L extends AnyLocale, KA extends NamespaceMap<RA>> {
  (): RPlugMapDecl<RA, L, KA, {}>;
  <NL extends NamespaceList<RA>>(...namespaces: NL): RPlugListDecl<RA, L, KA, NL>;
  <NM extends NamespaceMap<RA>>(namespaces: NM): RPlugMapDecl<RA, L, KA, NM>;
}

interface RPlugListDecl<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> {
  readonly use: () => RPlugList<RA, L, KA, NL>;
}

type RPlugList<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> = [...RList<RA, NL>, RCtx<RA, L, KA>, RWire];

interface RPlugMapDecl<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> {
  readonly use: () => RPlugMap<RA, L, KA, NM>;
}

type RPlugMap<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> = RMap<RA, Omit<NM, "$" | "_" | keyof KA>> & {
  readonly $: RCtx<RA, L, KA>;
  readonly _: RWire;
} & RMap<RA, KA>;

type RCtx<RA extends AnyResourceAtlas, L extends AnyLocale, KA extends NamespaceMap<RA>> = {
  readonly locale: L;
} & (keyof KA extends never ? {} : { readonly kit: RMap<RA, KA> });

interface RWire {
  readonly relay: any;
  readonly cmd: CmdComposer;
  readonly surface: SurfaceComposer;
}

// #endregion

// #region RReactivePlug

interface RReactivePlug<RA extends AnyResourceAtlas, L extends AnyLocale, KA extends NamespaceMap<RA>> {
  <S extends object>(defaultState: () => Promise<S>): RReactivePlugAsyncComposer<RA, L, KA, S>;
  <S extends object>(defaultState: () => S): RReactivePlugComposer<RA, L, KA, S>;
  <S extends object>(defaultState: S): RReactivePlugComposer<RA, L, KA, S>;
}

interface RReactivePlugAsyncComposer<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  S extends object,
> {
  readonly connect: RReactivePlugAsyncConnector<RA, L, KA, S>;
}

interface RReactivePlugComposer<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  S extends object,
> {
  readonly connect: RReactivePlugConnector<RA, L, KA, S>;
}

interface RReactivePlugAsyncConnector<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  S extends object,
> {
  (): Promise<RReactivePlugMapDecl<RA, L, KA, S, {}>>;
  <NL extends NamespaceList<RA>>(...namespaces: NL): Promise<RReactivePlugListDecl<RA, L, KA, S, NL>>;
  <NM extends NamespaceMap<RA>>(namespaces: NM): Promise<RReactivePlugMapDecl<RA, L, KA, S, NM>>;
}

interface RReactivePlugConnector<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  S extends object,
> {
  (): RReactivePlugMapDecl<RA, L, KA, S, {}>;
  <NL extends NamespaceList<RA>>(...namespaces: NL): RReactivePlugListDecl<RA, L, KA, S, NL>;
  <NM extends NamespaceMap<RA>>(namespaces: NM): RReactivePlugMapDecl<RA, L, KA, S, NM>;
}

interface RReactivePlugListDecl<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  S extends object,
  NL extends NamespaceList<RA>,
> {
  readonly use: () => RReactivePlugList<RA, L, KA, S, NL>;
}

type RReactivePlugList<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  S extends object,
  NL extends NamespaceList<RA>,
> = [...RList<RA, NL>, RReactiveCtx<RA, L, KA, S>, RReactiveWire<S>];

interface RReactivePlugMapDecl<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  S extends object,
  NM extends NamespaceMap<RA>,
> {
  readonly use: () => RReactivePlugMap<RA, L, KA, S, NM>;
}

type RReactivePlugMap<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  S extends object,
  NM extends NamespaceMap<RA>,
> = RMap<RA, Omit<NM, "$" | "_" | keyof KA>> & {
  readonly $: RReactiveCtx<RA, L, KA, S>;
  readonly _: RReactiveWire<S>;
} & RMap<RA, KA>;

type RReactiveCtx<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  S extends object,
> = RCtx<RA, L, KA> & {
  readonly state: S;
  readonly defaultState: S;
};

interface RReactiveWire<S extends object> {
  readonly getter: GetterComposer<S>;
  readonly action: ActionComposer<S>;
  readonly cmd: CmdComposer;
  readonly relay: any;
  readonly surface: ReactiveSurfaceComposer<S>;
}

// #endregion

// #region Getter

declare const getterBrand: unique symbol;
interface GetterBrand {
  readonly [getterBrand]?: true;
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
  readonly [actionBrand]?: true;
}
type Action<F extends (...args: any[]) => any> = F & ActionBrand;

interface ActionComposer<S extends object> {
  (): Action<(partialState: DeepPartial<S>) => S>;
  <A extends unknown[]>(reducer: (...args: A) => DeepPartial<S>): Action<(...args: A) => S>;
}

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

// #region Surface

type AnySurface = Record<string, unknown> & object;

type SurfaceFactory<S extends AnySurface> = () => S | Promise<S>;
type AnySurfaceFactory = SurfaceFactory<AnySurface>;

type PublicSurfaceItem<I> = I extends Getter<infer F> ? ReturnType<F> : I;
type PublicSurface<S extends AnySurface> = {
  readonly [K in keyof S as K extends `$${string}` ? never : K]: PublicSurfaceItem<S[K]>;
};

type SurfaceComposer = <S extends AnySurface>(surface: S, teardown?: () => void) => S;

type AnyReactiveSurfaceItem = ActionBrand | GetterBrand | ((...args: any[]) => any);
interface AnyReactiveSurface {
  readonly [key: string]: AnyReactiveSurfaceItem;
}

type ReactiveDefaultSurface<S extends object, N extends string> = {
  [K in N]: Getter<() => S>;
} & {
  [K in `set${Capitalize<N>}`]: Action<(partialState: DeepPartial<S>) => S>;
};

interface ReactiveSurfaceComposer<S extends object> {
  (): ReactiveDefaultSurface<S, "state">;
  <N extends string>(name: N): ReactiveDefaultSurface<S, N>;
  <S extends AnyReactiveSurface>(surface: S, teardown?: () => void): S;
}

// #endregion

// #region ResourceAtlas

type AnyRForge = AnySurfaceFactory | AnySurface;

interface RModule<RF extends AnyRForge> {
  readonly r: RF;
}
type AnyRModule = RModule<AnyRForge>;

type RSurface<RF extends AnyRForge> = RF extends () => infer S ? (S extends Promise<infer S2> ? S2 : S) : RF;

interface AnyResourceSurfaceAtlas {
  readonly [namespace: AnyNamespace]: AnyRModule;
}

export type ResourceAtlasShape<RA extends AnyResourceSurfaceAtlas> = {
  [N in Namespace<RA>]: PublicSurface<RSurface<RA[N]["r"]>>;
};

// endregion
