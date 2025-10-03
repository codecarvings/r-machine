export type AnyNamespace = string;

export type AnyR = object;

export interface AnyAtlas {
  readonly [namespace: AnyNamespace]: AnyR;
}

export type AtlasNamespace<A extends AnyAtlas> = Extract<keyof A, AnyNamespace>;

// Force branded type name
const r: unique symbol = Symbol.for("R");
export type R<T> = T & { [r]?: "R-Machine resource" };
