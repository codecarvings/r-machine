export interface AnyAtlas {
  readonly [string: string]: object;
}

export type AtlasNamespace<A extends AnyAtlas> = keyof A;

export type AtlasNamespaceList<A extends AnyAtlas> = ReadonlyArray<AtlasNamespace<A>>;

export type RKit<A extends AnyAtlas, NL extends AtlasNamespaceList<A>> = {
  readonly [I in keyof NL]: NL[I] extends keyof A ? A[NL[I]] : never;
};
