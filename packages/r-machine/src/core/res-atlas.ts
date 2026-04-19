import type { RMachineTypeError } from "../errors/r-machine-type-error.js";
import type { ReactiveGearTag } from "./reactive-gear.js";
import type { AnyResDomain, Namespace, Token, TokenBuilder } from "./res-domain.js";
import type { AnyResLayout, ResLayoutEntryType, ResolveLayoutType } from "./res-layout.js";

type ResAtlasSubMap<RL extends AnyResLayout, A, T extends ResLayoutEntryType> = {
  readonly [K in keyof A as K extends string ? (ResolveLayoutType<RL, K> extends T ? K : never) : never]: A[K];
};

declare const resAtlasSymbol: unique symbol;
export interface ResAtlas<RL extends AnyResLayout, RD> {
  readonly [resAtlasSymbol]: true;
  readonly gear: ResAtlasSubMap<RL, RD, "gear">;
  readonly "gear:vertex": ResAtlasSubMap<RL, RD, "gear:vertex">;
  readonly "shell:*": ResAtlasSubMap<RL, RD, "shell" | "shell:mono">;
  readonly res: RD;
}

export interface AnyResAtlas {
  readonly [resAtlasSymbol]: true;
  readonly gear: AnyResDomain;
  readonly "gear:vertex": AnyResDomain;
  readonly "shell:*": AnyResDomain;
  readonly res: AnyResDomain;
}

export type DroppedAtlasKeys<RA, RD> = Exclude<keyof RA, keyof RD>;

declare const rawResAtlasShapeSymbol: unique symbol;
export type ResAtlasClass<RL extends AnyResLayout, RD extends AnyResDomain, RA = RD> = (abstract new () => ResAtlas<
  RL,
  RD
>) & {
  readonly layout: RL;
  readonly [rawResAtlasShapeSymbol]: RA;

  getTokenBuilder(
    ..._atlas_error: [DroppedAtlasKeys<RA, RD>] extends [never]
      ? []
      : [
          RMachineTypeError<`Invalid namespaces declared in atlas shape (dropped by layout filter): *** ${DroppedAtlasKeys<
            RA,
            RD
          > &
            string} ***`>,
        ]
  ): TokenBuilder<RD>;
};

export type AnyResAtlasClass = (abstract new () => AnyResAtlas) & {
  readonly layout: AnyResLayout;
  readonly [rawResAtlasShapeSymbol]: AnyResDomain;
  getTokenBuilder(...args: never[]): TokenBuilder<AnyResDomain>;
};

export type SolidNamespace<RA extends AnyResAtlas> =
  | Namespace<RA["shell:*"]>
  | {
      [N in Namespace<RA["gear"]>]: RA["gear"][N] extends ReactiveGearTag ? never : N;
    }[Namespace<RA["gear"]>];

export type SolidNamespaceRef<RA extends AnyResAtlas> = SolidNamespace<RA> | Token<SolidNamespace<RA>>;
