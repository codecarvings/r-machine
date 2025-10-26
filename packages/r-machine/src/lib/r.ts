import type { AnyRForge } from "./r-module.js";

export type AnyNamespace = string;

export type AnyR = object;

export interface AnyAtlas {
  readonly [namespace: AnyNamespace]: AnyRForge;
}

export type AtlasNamespace<A extends AnyAtlas> = Extract<keyof A, AnyNamespace>;

type RType<F extends AnyRForge> = F extends (...args: any[]) => infer R ? (R extends Promise<infer R2> ? R2 : R) : F;

// Force branded type
const r = Symbol("R");
class RBrand {
  protected readonly [r]?: "R-Machine resource";
}

export type R<F extends AnyRForge> = RType<F> & RBrand;
