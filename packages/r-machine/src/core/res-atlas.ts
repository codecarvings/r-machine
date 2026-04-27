import type { RMachineTypeError } from "#r-machine/errors";
import type { AnyResDomain, AnyResDomainLayout, Namespace, Token, TokenBuilder } from "./res-domain.js";
import type { AnyResLayout, ResLayoutEntryType, ResolveLayoutType } from "./res-layout.js";

type ShapeMap<RL extends AnyResLayout, RD extends AnyResDomain, T extends ResLayoutEntryType> = {
  readonly [K in keyof RD as K extends string ? (ResolveLayoutType<RL, K> extends T ? K : never) : never]: RD[K];
};

type ResLayoutEntryTypeMap<RL extends AnyResLayout, RD extends AnyResDomain> = {
  readonly [K in keyof RD]: K extends string ? ResolveLayoutType<RL, K> : never;
};

declare const resAtlasSymbol: unique symbol;
export interface ResAtlas<RL extends AnyResLayout, RD extends AnyResDomain> {
  readonly [resAtlasSymbol]: true;
  readonly shape: RD;
  readonly "shape@gear:hub": ShapeMap<RL, RD, "gear:hub">;
  readonly "shape@shell": ShapeMap<RL, RD, "shell" | "shell(mono)">;
  readonly "valid@gear:inner": ShapeMap<RL, RD, "gear:inner" | "gear:hub">;
  readonly "valid@gear:outer": ShapeMap<RL, RD, "gear:hub" | "gear:outer">;
  readonly "valid@universal": ShapeMap<
    RL,
    RD,
    "gear:inner" | "gear:hub" | "gear:outer" | "gear:outer(vertex)" | "shell" | "shell(mono)"
  >;
  readonly "valid@universal:kit": ShapeMap<RL, RD, "gear:inner" | "gear:hub" | "gear:outer" | "shell" | "shell(mono)">;
  readonly "valid@server": ShapeMap<RL, RD, "gear:inner" | "gear:hub" | "shell" | "shell(mono)">;
  readonly "valid@client": ShapeMap<RL, RD, "gear:hub" | "gear:outer" | "gear:outer(vertex)" | "shell" | "shell(mono)">;
  readonly "valid@client:kit": ShapeMap<RL, RD, "gear:hub" | "gear:outer" | "shell" | "shell(mono)">;
  readonly let: ResLayoutEntryTypeMap<RL, RD>;
}

export interface AnyResAtlas {
  readonly [resAtlasSymbol]: true;
  readonly shape: AnyResDomain;
  readonly "shape@gear:hub": AnyResDomain;
  readonly "shape@shell": AnyResDomain;
  readonly "valid@gear:inner": AnyResDomain;
  readonly "valid@gear:outer": AnyResDomain;
  readonly "valid@universal": AnyResDomain;
  readonly "valid@universal:kit": AnyResDomain;
  readonly "valid@server": AnyResDomain;
  readonly "valid@client": AnyResDomain;
  readonly "valid@client:kit": AnyResDomain;
  readonly let: AnyResDomainLayout;
}

export type ResAtlasCatalog =
  | "shape"
  | "shape@gear:hub"
  | "shape@shell"
  | "valid@gear:inner"
  | "valid@gear:outer"
  | "valid@universal"
  | "valid@universal:kit"
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
  readonly getTokenBuilder: (...args: never[]) => TokenBuilder<AnyResDomain>;
};

export type SolidNamespace<RA extends AnyResAtlas> =
  | Namespace<RA["valid@gear:inner"]>
  | Namespace<RA["shape@gear:hub"]>
  | Namespace<RA["shape@shell"]>;

export type SolidHandle<RA extends AnyResAtlas> = SolidNamespace<RA> | Token<SolidNamespace<RA>>;
