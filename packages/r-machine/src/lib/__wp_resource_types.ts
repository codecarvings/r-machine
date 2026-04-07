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

// TODO: WIP;

// #region RMachineToolset

export interface RMachineToolset<RA extends AnyResourceAtlas, L extends AnyLocale, KA extends NamespaceMap<RA>> {
  readonly GearPlug: GearPlugComposer<RA, KA>;
  readonly ShellPlug: ShellPlugComposer<RA, L, KA>;
  readonly localized: LocalizerHelper<RA>;
}

type LocalizerHelper<RA extends AnyResourceAtlas> = <N extends Namespace<RA>, const R extends RA[N]>(
  namespace: N,
  shell: R
) => R;

// #endregion

// #region GearPlug

type AnyState = unknown; // Record<PropertyKey, unknown> & object;

interface GearPlugComposer<RA extends AnyResourceAtlas, KA extends NamespaceMap<RA>> {
  (): GearMapPlug<RA, KA, {}>;
  <NL extends NamespaceList<RA>>(...namespaces: NL): GearListPlug<RA, KA, NL>;
  <NM extends NamespaceMap<RA>>(namespaces: NM): GearMapPlug<RA, KA, NM>;
}

interface GearMapPlug<RA extends AnyResourceAtlas, KA extends NamespaceMap<RA>, NM extends NamespaceMap<RA>> {
  plain(): PlainGearMapPlug<RA, KA, NM>;
  reactive<S extends AnyState>(state: S): ReactiveMapPlug<RA, KA, NM, S>;
  reactive(): StatelessReactiveMapPlug<RA, KA, NM>;
}

interface GearListPlug<RA extends AnyResourceAtlas, KA extends NamespaceMap<RA>, NL extends NamespaceList<RA>> {
  plain(): PlainGearListPlug<RA, KA, NL>;
  reactive<S extends AnyState>(state: S): ReactiveListPlug<RA, KA, NL, S>;
  reactive(): StatelessReactiveListPlug<RA, KA, NL>;
}

// #endregion

// #region GearPlug - Plain

interface PlainGearMapPlug<RA extends AnyResourceAtlas, KA extends NamespaceMap<RA>, NM extends NamespaceMap<RA>> {
  readonly Gear: PlainGearFactoryComposer;
  readonly VertexGear: PlainGearFactoryComposer;
  use(): PlainGearMapPlugPackage<RA, KA, NM>;
}

type PlainGearMapPlugPackage<
  RA extends AnyResourceAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> = SurfaceMap<RA, Omit<NM, "$" | "_" | keyof KA>> & {
  readonly $: PlainGearPlugCtx<RA, KA>;
  readonly _: PlainGearPlugCursor;
} & SurfaceMap<RA, KA>;

interface PlainGearListPlug<RA extends AnyResourceAtlas, KA extends NamespaceMap<RA>, NL extends NamespaceList<RA>> {
  readonly Gear: PlainGearFactoryComposer;
  readonly VertexGear: PlainGearFactoryComposer;
  use(): PlainGearListPlugPackage<RA, KA, NL>;
}

type PlainGearPlugCtx<RA extends AnyResourceAtlas, KA extends NamespaceMap<RA>> = {} & (keyof KA extends never
  ? {}
  : { readonly kit: SurfaceMap<RA, KA> });

interface PlainGearPlugCursor {
  readonly relay: RelayComposer;
  readonly cmd: CmdComposer;
}

declare const plainGearFactoryBrand: unique symbol;
interface PlainGearFactoryBrand {
  readonly [plainGearFactoryBrand]: true;
}
type PlainGearFactory<R extends AnyResource> = (() => R) & PlainGearFactoryBrand;
type AnyPlainGearFactory = PlainGearFactory<AnyResource>;
type PlainGearFactoryComposer = <R extends AnyResource>(factory: () => R | Promise<R>) => PlainGearFactory<R>;

type PlainGearListPlugPackage<
  RA extends AnyResourceAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> = [...SurfaceList<RA, NL>, PlainGearPlugCtx<RA, KA>, PlainGearPlugCursor];

// #endregion

// #region GearPlug / Reactive - Stateful

interface ReactiveMapPlug<
  RA extends AnyResourceAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  S extends AnyState,
> {
  readonly Gear: ReactiveGearFactoryComposer<S>;
  readonly VertexGear: ReactiveGearFactoryComposer<S>;
  use(): ReactiveMapPlugPackage<RA, KA, NM, S>;
}

type ReactiveMapPlugPackage<
  RA extends AnyResourceAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
  S extends AnyState,
> = SurfaceMap<RA, Omit<NM, "$" | "_" | keyof KA>> & {
  readonly $: ReactivePlugCtx<RA, KA, S>;
  readonly _: ReactivePlugCursor<S>;
} & SurfaceMap<RA, KA>;

interface ReactiveListPlug<
  RA extends AnyResourceAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  S extends AnyState,
> {
  readonly Gear: ReactiveGearFactoryComposer<S>;
  readonly VertexGear: ReactiveGearFactoryComposer<S>;
  use(): ReactiveListPlugPackage<RA, KA, NL, S>;
}

type ReactiveListPlugPackage<
  RA extends AnyResourceAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
  S extends AnyState,
> = [...SurfaceList<RA, NL>, ReactivePlugCtx<RA, KA, S>, ReactivePlugCursor<S>];

type ReactivePlugCtx<RA extends AnyResourceAtlas, KA extends NamespaceMap<RA>, S extends AnyState> = {
  readonly state: S;
  readonly defaultState: S;
} & (keyof KA extends never ? {} : { readonly kit: SurfaceMap<RA, KA> });

interface ReactivePlugCursor<S extends AnyState> {
  readonly getter: GetterComposer<S>;
  readonly action: ActionComposer<S>;
  readonly relay: RelayComposer;
  readonly cmd: CmdComposer;
}

type AnyReactiveResourceItem = ActionBrand | GetterBrand | RelayBrand | ((...args: any[]) => any);
interface AnyReactiveResource {
  readonly [key: string]: AnyReactiveResourceItem;
}

declare const reactiveGearFactoryBrand: unique symbol;
interface ReactiveGearFactoryBrand {
  readonly [reactiveGearFactoryBrand]: true;
}
type ReactiveGearFactory<R extends AnyReactiveResource> = (() => R) & ReactiveGearFactoryBrand;
type AnyReactiveGearFactory = ReactiveGearFactory<AnyReactiveResource>;

type ReadableReactiveGearResource<S extends AnyState, G extends string> = { readonly [P in G]: Getter<() => S> };
type WritableReactiveGearResource<S extends AnyState, G extends string, A extends string> = {
  readonly [P in G]: Getter<() => S>;
} & {
  readonly [P in A]: Action<(partialState: DeepPartial<S>) => S>;
};

interface ReactiveGearFactoryComposer<S extends AnyState> extends StatelessReactiveGearFactoryComposer {
  <const G extends string, const A extends string>(
    factory: () => readonly [G, A] | Promise<readonly [G, A]>
  ): ReactiveGearFactory<WritableReactiveGearResource<S, G, A>>;
  <const G extends string>(
    factory: () => readonly [G] | Promise<readonly [G]>
  ): ReactiveGearFactory<ReadableReactiveGearResource<S, G>>;
}

// #endregion

// #region GearPlug / Reactive - Stateless

interface StatelessReactiveMapPlug<
  RA extends AnyResourceAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> {
  readonly Gear: StatelessReactiveGearFactoryComposer;
  readonly VertexGear: StatelessReactiveGearFactoryComposer;
  use(): StatelessReactiveMapPlugPackage<RA, KA, NM>;
}

type StatelessReactiveMapPlugPackage<
  RA extends AnyResourceAtlas,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> = SurfaceMap<RA, Omit<NM, "$" | "_" | keyof KA>> & {
  readonly $: StatelessReactivePlugCtx<RA, KA>;
  readonly _: StatelessReactivePlugCursor;
} & SurfaceMap<RA, KA>;

interface StatelessReactiveListPlug<
  RA extends AnyResourceAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> {
  readonly Gear: StatelessReactiveGearFactoryComposer;
  readonly VertexGear: StatelessReactiveGearFactoryComposer;
  use(): StatelessReactiveListPlugPackage<RA, KA, NL>;
}

type StatelessReactiveListPlugPackage<
  RA extends AnyResourceAtlas,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> = [...SurfaceList<RA, NL>, StatelessReactivePlugCtx<RA, KA>, StatelessReactivePlugCursor];

type StatelessReactivePlugCtx<RA extends AnyResourceAtlas, KA extends NamespaceMap<RA>> = keyof KA extends never
  ? {}
  : { readonly kit: SurfaceMap<RA, KA> };

interface StatelessReactivePlugCursor {
  readonly getter: StatelessGetterComposer;
  readonly relay: RelayComposer;
  readonly cmd: CmdComposer;
}

type StatelessReactiveGearFactoryComposer = <R extends AnyReactiveResource>(
  factory: () => R | Promise<R>
) => ReactiveGearFactory<R>;

// #endregion

// #endregion

// #region ShellPlug

interface ShellPlugComposer<RA extends AnyResourceAtlas, L extends AnyLocale, KA extends NamespaceMap<RA>> {
  (): ShellMapPlug<RA, L, KA, {}>;
  <NL extends NamespaceList<RA>>(...namespaces: NL): ShellListPlug<RA, L, KA, NL>;
  <NM extends NamespaceMap<RA>>(namespaces: NM): ShellMapPlug<RA, L, KA, NM>;
}

interface ShellMapPlug<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> {
  readonly Shell: ShellFactoryComposer;
  use(): ShellMapPlugPackage<RA, L, KA, NM>;
}

type ShellMapPlugPackage<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NM extends NamespaceMap<RA>,
> = SurfaceMap<RA, Omit<NM, "$" | "_" | keyof KA>> & {
  readonly $: ShellPlugCtx<RA, L, KA>;
  readonly _: ShellPlugCursor;
} & SurfaceMap<RA, KA>;

interface ShellListPlug<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> {
  readonly Shell: ShellFactoryComposer;
  use(): ShellListPlugPackage<RA, L, KA, NL>;
}

type ShellListPlugPackage<
  RA extends AnyResourceAtlas,
  L extends AnyLocale,
  KA extends NamespaceMap<RA>,
  NL extends NamespaceList<RA>,
> = [...SurfaceList<RA, NL>, ShellPlugCtx<RA, L, KA>, ShellPlugCursor];

type ShellPlugCtx<RA extends AnyResourceAtlas, L extends AnyLocale, KA extends NamespaceMap<RA>> = {
  readonly locale: L;
} & (keyof KA extends never ? {} : { readonly kit: SurfaceMap<RA, KA> });

type ShellPlugCursor = {};

declare const shellFactoryBrand: unique symbol;
interface ShellFactoryBrand {
  readonly [shellFactoryBrand]: true;
}
type ShellFactory<R extends AnyResource> = (() => R) & ShellFactoryBrand;
type AnyShellFactory = ShellFactory<AnyResource>;
type ShellFactoryComposer = <R extends AnyResource>(factory: () => R | Promise<R>) => ShellFactory<R>;

// #endregion

// #region Getter

declare const getterBrand: unique symbol;
interface GetterBrand {
  readonly [getterBrand]: true;
}
type Getter<V> = () => V & GetterBrand;

type StatelessGetterComposer = <V>(getter: () => V) => Getter<V>;

interface GetterComposer<S extends AnyState> extends StatelessGetterComposer {
  (): Getter<() => S>;
}

// #endregion

// #region Action

type BuiltinAtomic =
  | Date
  | RegExp
  | Map<unknown, unknown>
  | Set<unknown>
  | ((...args: any[]) => any)
  | Promise<unknown>
  | Error
  | URL
  | URLSearchParams
  | ArrayBuffer
  | ArrayBufferView;

declare const atomicBrand: unique symbol;
export type Atomic = { readonly [atomicBrand]?: undefined };

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

interface ActionComposer<S extends AnyState> {
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
  readonly payload: unknown[];
}

type CmdComposer = <F extends (...args: any[]) => any>(action: Action<F>, ...args: Parameters<F>) => Cmd;

// #endregion

// #region Resource

type AnyResource = Record<string, unknown> & object;

type AnyResourceFactory = AnyPlainGearFactory | AnyReactiveGearFactory | AnyShellFactory;

// #endregion

// #region Surface

type SurfaceItem<I> = I extends Getter<infer V> ? V : I extends RelayBrand ? never : I;

export type Surface<R extends AnyResource> = {
  readonly [K in keyof R as K extends `$${string}` ? never : K]: SurfaceItem<R[K]>;
};

// #endregion

// #region ResourceAtlas

type AnyResourceOrigin = AnyResourceFactory | AnyResource;

type Resource<RF extends AnyResourceOrigin> = RF extends () => infer R ? R : RF;

// Re-exported from setup.ts as R
declare const r: unique symbol;
export type BrandedResource<RF extends AnyResourceOrigin> = Resource<RF> & {
  readonly [r]?: undefined; // Allow nominal typing for resources
};

export type AnyNamespace = string;

export interface AnyResourceAtlas {
  readonly [namespace: AnyNamespace]: any; // Do not use AnyResource - It breaks token system
}

export type Namespace<RA extends AnyResourceAtlas> = Extract<keyof RA, AnyNamespace>;

// #endregion

// #region Token

const namespace = Symbol("namespace");
interface Token<N extends string> {
  readonly [namespace]: N;
}

type TokenBuilder<RA extends AnyResourceAtlas> = <N extends Namespace<RA>>(namespace: N) => Token<N>;

export function createTokenBuilder<RA extends AnyResourceAtlas>(): TokenBuilder<RA> {
  return <N extends Namespace<RA>>(ns: N) => ({ [namespace]: ns });
}

type NamespaceRef<RA extends AnyResourceAtlas> = Namespace<RA> | Token<Namespace<RA>>;

type ExtractNamespace<T extends NamespaceRef<any>> = T extends Token<infer N> ? N : T;

// #endregion

// #region RMap

type NamespaceMap<RA extends AnyResourceAtlas> = {
  readonly [k: string]: NamespaceRef<RA>;
};

type SurfaceMap<RA extends AnyResourceAtlas, NM extends NamespaceMap<RA>> = {
  // TODO: WP
  readonly [K in keyof NM]: Surface<RA[ExtractNamespace<NM[K]>]>;
};

// #endregion

// #region RList

export type NamespaceList<RA extends AnyResourceAtlas> = readonly NamespaceRef<RA>[];

export type SurfaceList<RA extends AnyResourceAtlas, NL extends NamespaceList<RA>> = {
  readonly [I in keyof NL]: Surface<RA[ExtractNamespace<NL[I]>]>;
};

// #endregion
