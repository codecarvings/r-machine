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
  readonly "shape@gear:server": ShapeMap<RL, RD, "gear:server">;
  readonly "shape@gear:client": ShapeMap<RL, RD, "gear:client">;
  readonly "shape@shell:*": ShapeMap<RL, RD, "shell" | "shell(mono)">;
  readonly "shape@server": ShapeMap<RL, RD, "gear:hub" | "gear:server" | "shell" | "shell(mono)">;
  readonly "shape@client": ShapeMap<RL, RD, "gear:hub" | "gear:client" | "shell" | "shell(mono)">;
  readonly let: ResLayoutEntryTypeMap<RL, RD>;
}

export interface AnyResAtlas {
  readonly [resAtlasSymbol]: true;
  readonly shape: AnyResDomain;
  readonly "shape@gear:hub": AnyResDomain;
  readonly "shape@gear:server": AnyResDomain;
  readonly "shape@gear:client": AnyResDomain;
  readonly "shape@shell:*": AnyResDomain;
  readonly "shape@server": AnyResDomain;
  readonly "shape@client": AnyResDomain;
  readonly let: AnyResDomainLayout;
}

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
  | Namespace<RA["shape@gear:hub"]>
  | Namespace<RA["shape@gear:server"]>
  | Namespace<RA["shape@shell:*"]>;

/*
export type SolidNamespace<RA extends AnyResAtlas> =
  | Namespace<RA["shape@shell:*"]>
  | {
      [N in Namespace<RA["shape@gear"]>]: RA["shape@gear"][N] extends ReactiveGearTag ? never : N;
    }[Namespace<RA["shape@gear"]>];
*/

export type SolidHandle<RA extends AnyResAtlas> = SolidNamespace<RA> | Token<SolidNamespace<RA>>;
