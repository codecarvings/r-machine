import type { AnyResDomain } from "./res-domain.js";
import type { AnyResLayout, ResLayoutEntryType, ResolveLayoutType } from "./res-layout.js";

type ResAtlasSubMap<LO extends AnyResLayout, A, T extends ResLayoutEntryType> = {
  readonly [K in keyof A as K extends string ? (ResolveLayoutType<LO, K> extends T ? K : never) : never]: A[K];
};

export interface ResAtlas<RL extends AnyResLayout, RD> {
  readonly gear: ResAtlasSubMap<RL, RD, "gear">;
  readonly shell: ResAtlasSubMap<RL, RD, "shell" | "dynamic-shell">;
  readonly res: RD;
}

export interface AnyResAtlas {
  readonly gear: AnyResDomain;
  readonly shell: AnyResDomain;
  readonly res: AnyResDomain;
}

export type ResAtlasClass<RL extends AnyResLayout, RD> = (abstract new () => ResAtlas<RL, RD>) & {
  readonly layout: RL;
};

export type AnyResAtlasClass = (abstract new () => AnyResAtlas) & {
  readonly layout: AnyResLayout;
};
