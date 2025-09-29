export type AnyNamespace = string;

export type AnyR = object;

export interface AnyAtlas {
  readonly [namespace: AnyNamespace]: AnyR;
}

export type AtlasNamespace<A extends AnyAtlas> = Extract<keyof A, AnyNamespace>;
