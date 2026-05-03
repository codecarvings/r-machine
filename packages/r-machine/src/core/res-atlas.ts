import type { RMachineTypeError } from "#r-machine/errors";
import type { AnyResDomain, AnyResDomainLayout, Namespace, TokenBuilder } from "./res-domain.js";
import type { AnyResLayout, ResLayoutEntryType, ResolveLayoutType } from "./res-layout.js";
import type { AnyNamespaceList } from "./res-list.js";

type ShapeMap<RL extends AnyResLayout, RD extends AnyResDomain, T extends ResLayoutEntryType> = {
  readonly [K in keyof RD as K extends string ? (ResolveLayoutType<RL, K> extends T ? K : never) : never]: RD[K];
};

type ResLayoutEntryTypeMap<RL extends AnyResLayout, RD extends AnyResDomain> = {
  readonly [K in keyof RD]: K extends string ? ResolveLayoutType<RL, K> : never;
};

type LetMap<RL extends AnyResLayout, T extends ResLayoutEntryType> = {
  readonly [P in keyof RL as RL[P] extends T ? P : never]: RL[P];
};

declare const resAtlasSymbol: unique symbol;
export interface ResAtlas<RL extends AnyResLayout, RD extends AnyResDomain> {
  readonly [resAtlasSymbol]: true;
  readonly shape: RD;
  readonly "shape@gear:base": ShapeMap<RL, RD, "gear:base">;
  readonly "shape@gear:outer": ShapeMap<RL, RD, "gear:outer">;
  readonly "shape@shell": ShapeMap<RL, RD, "shell" | "shell(mono)">;
  readonly "valid@gear:inner": ShapeMap<RL, RD, "gear:inner" | "gear:base">;
  readonly "valid@gear:outer": ShapeMap<RL, RD, "gear:base" | "gear:outer">;
  readonly "valid@server": ShapeMap<RL, RD, "gear:inner" | "gear:base" | "shell" | "shell(mono)">;
  readonly "valid@client": ShapeMap<
    RL,
    RD,
    "gear:base" | "gear:outer" | "gear:outer(vertex)" | "shell" | "shell(mono)"
  >;
  readonly "valid@client:kit": ShapeMap<RL, RD, "gear:base" | "gear:outer" | "shell" | "shell(mono)">;
  readonly let: ResLayoutEntryTypeMap<RL, RD>;
  readonly "let@gear:inner": LetMap<RL, "gear:inner">;
}

export interface AnyResAtlas {
  readonly [resAtlasSymbol]: true;
  readonly shape: AnyResDomain;
  readonly "shape@gear:base": AnyResDomain;
  readonly "shape@gear:outer": AnyResDomain;
  readonly "shape@shell": AnyResDomain;
  readonly "valid@gear:inner": AnyResDomain;
  readonly "valid@gear:outer": AnyResDomain;
  readonly "valid@server": AnyResDomain;
  readonly "valid@client": AnyResDomain;
  readonly "valid@client:kit": AnyResDomain;
  readonly let: AnyResDomainLayout;
  readonly "let@gear:inner": AnyResLayout;
}

export type ResAtlasCatalog =
  | "shape"
  | "shape@gear:base"
  | "shape@gear:outer"
  | "shape@shell"
  | "valid@gear:inner"
  | "valid@gear:outer"
  | "valid@server"
  | "valid@client"
  | "valid@client:kit";

type DroppedAtlasKeys<RA, RD> = Exclude<keyof RA, keyof RD>;

declare const rawResAtlasShapeSymbol: unique symbol;
export type ResAtlasClass<RL extends AnyResLayout, RD extends AnyResDomain, RA = RD> = (abstract new () => ResAtlas<
  RL,
  RD
>) & {
  readonly layout: RL;
  readonly [rawResAtlasShapeSymbol]: RA;
  readonly priority: readonly Namespace<RD>[];

  readonly withPriority: <P extends readonly Namespace<RD>[]>(priority: P) => ResAtlasClass<RL, RD, RA>;

  readonly getTokenBuilder: (
    ..._atlas_error: [DroppedAtlasKeys<RA, RD>] extends [never]
      ? []
      : [
          RMachineTypeError<`Invalid namespaces declared in atlas shape (dropped by layout filter): *** ${DroppedAtlasKeys<
            RA,
            RD
          > &
            string} ***`>,
        ]
  ) => TokenBuilder<RD>;
};

export type AnyResAtlasClass = (abstract new () => AnyResAtlas) & {
  readonly layout: AnyResLayout;
  readonly [rawResAtlasShapeSymbol]: AnyResDomain;
  readonly priority: AnyNamespaceList;
  readonly withPriority: (...args: never[]) => AnyResAtlasClass;
  readonly getTokenBuilder: (...args: never[]) => TokenBuilder<AnyResDomain>;
};
