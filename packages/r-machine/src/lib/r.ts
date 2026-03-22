import type { AnyRForge } from "./r-module.js";

export type AnyNamespace = string;

export type AnyR = object;

export interface AnyResourceAtlas {
  readonly [namespace: AnyNamespace]: AnyR;
}

export type Namespace<RA extends AnyResourceAtlas> = Extract<keyof RA, AnyNamespace>;

type RType<F extends AnyRForge> = F extends (...args: any[]) => infer R ? (R extends Promise<infer R2> ? R2 : R) : F;

// Branded type
declare const _rBrand: unique symbol;
interface RBrand {
  readonly [_rBrand]?: "R-Machine Resource";
}

export type R<F extends AnyRForge> = RType<F> & RBrand;
