import type { ReactiveGearTag } from "./reactive-gear.js";
import type { VertexGearTag } from "./vertex-gear.js";

export type AnyNamespace = string;

export interface AnyResAtlas {
  readonly [namespace: AnyNamespace]: any; // Do not use AnyRes - It breaks token system
}

// Minimal shape of a resource-atlas instance produced by `defineLayout(...)<A>()`.
// Lives here (core) rather than in lib/ so that composers in core can constrain
// on it without importing from lib (core must not depend on lib).
// The three sub-maps (`gear`, `shell`, `res`) are precomputed at class-build
// time and consumed downstream for dep filtering / surface lookup.
export interface AnyResAtlasInstance {
  readonly gear: Record<AnyNamespace, any>;
  readonly shell: Record<AnyNamespace, any>;
  readonly res: AnyResAtlas;
}

export type Namespace<RA extends AnyResAtlas> = Extract<keyof RA, AnyNamespace>;

export type SolidNamespace<RA extends AnyResAtlas> = {
  [K in Namespace<RA>]: RA[K] extends ReactiveGearTag | VertexGearTag ? never : K;
}[Namespace<RA>];

const namespaceSymbol = Symbol("namespace");
export interface Token<N extends string> {
  readonly [namespaceSymbol]: N;
}

export type NamespaceRef<RA extends AnyResAtlas> = Namespace<RA> | Token<Namespace<RA>>;
export type SolidNamespaceRef<RA extends AnyResAtlas> = SolidNamespace<RA> | Token<SolidNamespace<RA>>;

export type ExtractNamespace<T extends NamespaceRef<any>> = T extends Token<infer N> ? N : T;

export function getNamespace<T extends NamespaceRef<any>>(tokenOrNamespace: T): ExtractNamespace<T> {
  if (typeof tokenOrNamespace === "string") {
    return tokenOrNamespace as ExtractNamespace<T>;
  } else {
    return tokenOrNamespace[namespaceSymbol] as ExtractNamespace<T>;
  }
}

export function isNamespace<T extends NamespaceRef<any>>(value: T): boolean {
  return typeof value === "string" || (value && typeof value === "object" && namespaceSymbol in value);
}

export function createToken<N extends AnyNamespace>(namespace: N): Token<N> {
  return { [namespaceSymbol]: namespace };
}
