import type { AnyRModuleContent } from "./r-module.js";

export type AnyNamespace = string;

export type AnyR = object;

export interface AnyAtlas {
  readonly [namespace: AnyNamespace]: AnyRModuleContent;
}

export type AtlasNamespace<A extends AnyAtlas> = Extract<keyof A, AnyNamespace>;

export type RX<A extends AnyAtlas, N extends AtlasNamespace<A>> = A[N] extends (...args: any[]) => infer R
  ? R extends Promise<infer R2>
    ? R2
    : R
  : A[N];

// Force branded type name
const r: unique symbol = Symbol.for("R");
export type R<T> = T & { [r]?: "R-Machine resource" };
