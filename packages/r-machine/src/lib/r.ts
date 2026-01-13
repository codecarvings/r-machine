import type { AnyRForge } from "./r-module.js";

export type AnyNamespace = string;

export type AnyR = object;

export interface AnyResourceAtlas {
  readonly [namespace: AnyNamespace]: AnyRForge;
}

export type Namespace<RA extends AnyResourceAtlas> = Extract<keyof RA, AnyNamespace>;

type RType<F extends AnyRForge> = F extends (...args: any[]) => infer R ? (R extends Promise<infer R2> ? R2 : R) : F;

// Branded type
const brand = Symbol("R");
class RBrand {
  protected readonly [brand]?: "R-Machine resource";
}

export type R<F extends AnyRForge> = RType<F> & RBrand;
