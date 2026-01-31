import type { AnyNamespace, AnyR, AnyResourceAtlas, Namespace } from "./r.js";

export type AnyNamespaceList = readonly AnyNamespace[];

export type AnyRKit = readonly AnyR[];

export type NamespaceList<RA extends AnyResourceAtlas> = readonly Namespace<RA>[];

export type RKit<RA extends AnyResourceAtlas, NL extends NamespaceList<RA>> = {
  readonly [I in keyof NL]: RA[NL[I]];
};
