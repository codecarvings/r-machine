import type { AnyResDomain } from "./res-domain.js";
import type { AnyResLayout, ResLayoutEntryType, ResolveLayoutType } from "./res-layout.js";

type ResAtlasSubMap<RL extends AnyResLayout, A, T extends ResLayoutEntryType> = {
  readonly [K in keyof A as K extends string ? (ResolveLayoutType<RL, K> extends T ? K : never) : never]: A[K];
};

declare const resAtlasSymbol: unique symbol;
export interface ResAtlas<RL extends AnyResLayout, RD> {
  readonly [resAtlasSymbol]: true;
  readonly gear: ResAtlasSubMap<RL, RD, "gear">;
  readonly shell: ResAtlasSubMap<RL, RD, "shell" | "dynamic-shell">;
  readonly res: RD;
}

export interface AnyResAtlas {
  readonly [resAtlasSymbol]: true;
  readonly gear: AnyResDomain;
  readonly shell: AnyResDomain;
  readonly res: AnyResDomain;
}

declare const rawResAtlasShapeSymbol: unique symbol;
export type ResAtlasClass<RL extends AnyResLayout, RD, RA = RD> = (abstract new () => ResAtlas<RL, RD>) & {
  readonly layout: RL;
  readonly [rawResAtlasShapeSymbol]: RA;
};

export type AnyResAtlasClass = (abstract new () => AnyResAtlas) & {
  readonly layout: AnyResLayout;
  readonly [rawResAtlasShapeSymbol]: AnyResDomain;
};

export type ExtractRawResAtlasShape<RAC> = RAC extends { readonly [rawResAtlasShapeSymbol]: infer R } ? R : never;
