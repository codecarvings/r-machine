import type { AnyAtlas, AnyNamespace, AnyR, AtlasNamespace } from "./r.js";

export type AnyNamespaceList = readonly AnyNamespace[];

export type AnyRKit = readonly AnyR[];

export type AtlasNamespaceList<A extends AnyAtlas> = readonly AtlasNamespace<A>[];

export type RKit<A extends AnyAtlas, NL extends AtlasNamespaceList<A>> = {
  readonly [I in keyof NL]: A[NL[I]];
};
