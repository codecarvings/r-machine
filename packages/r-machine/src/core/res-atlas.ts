import type { RMachineTypeError } from "#r-machine/errors";
import type { AnyResDomain, AnyResDomainLayout, Namespace, TokenBuilder } from "./res-domain.js";
import type { AnyResLayout, ResLayoutEntryType, ResolveLayoutType } from "./res-layout.js";
import type { AnyNamespaceList } from "./res-list.js";
import type { AnyResourceLoader, ResourceLoader } from "./res-loader.js";

type ShapeMap<RL extends AnyResLayout, RD extends AnyResDomain, T extends ResLayoutEntryType> = {
  readonly [K in keyof RD as K extends string ? (ResolveLayoutType<RL, K> extends T ? K : never) : never]: RD[K];
};

// Namespaces starting with `#` are "internal": visible to gear→gear deps but
// hidden from consumer-facing surfaces (server/client/client:kit). PublicShapeMap
// is identical to ShapeMap, plus a guard that drops leading-`#` keys.
// ResolveLayoutType internally strips the leading `#` before matching layout
// prefixes, so "#outer/temp" still classifies as "gear:outer".
export type IsInternalNamespace<K> = K extends `#${string}` ? true : false;

type PublicShapeMap<RL extends AnyResLayout, RD extends AnyResDomain, T extends ResLayoutEntryType> = {
  readonly [K in keyof RD as K extends string
    ? ResolveLayoutType<RL, K> extends T
      ? IsInternalNamespace<K> extends true
        ? never
        : K
      : never
    : never]: RD[K];
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
  readonly "valid@direct": PublicShapeMap<RL, RD, "gear:base" | "shell" | "shell(mono)">;
  readonly "valid@server": PublicShapeMap<RL, RD, "gear:inner" | "gear:base" | "shell" | "shell(mono)">;
  readonly "valid@client": PublicShapeMap<
    RL,
    RD,
    "gear:base" | "gear:outer" | "gear:outer(vertex)" | "shell" | "shell(mono)"
  >;
  readonly "valid@client:kit": PublicShapeMap<RL, RD, "gear:base" | "gear:outer" | "shell" | "shell(mono)">;
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
  readonly "valid@direct": AnyResDomain;
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
  | "valid@direct"
  | "valid@server"
  | "valid@client"
  | "valid@client:kit";

type DroppedAtlasKeys<RA, RD> = Exclude<keyof RA, keyof RD>;

// Key-only check on the raw atlas shape RA (preserved via phantom symbol).
// Accessing RA[K] here would risk re-triggering the declaration-site
// circularity trap (see project_atlas_silent_filter memory).
//
// `@` and `:` are reserved anywhere in a namespace (future resource-pack
// scoping grammar). `#` is reserved only when it appears in non-leading
// position — a single leading `#` is the "internal namespace" marker.
type StrictReservedAtlasKeyChar = "@" | ":";
// Strip exactly one leading `#` (if present), then check whether the
// remainder still contains a `#`. If yes, the key has `#` in a forbidden
// (non-leading) position.
type StripLeadingHash<K extends string> = K extends `#${infer Rest}` ? Rest : K;
type HasNonLeadingHash<K extends string> = StripLeadingHash<K> extends `${string}#${string}` ? true : false;
type ReservedCharAtlasKeys<RA> =
  | Extract<keyof RA, `${string}${StrictReservedAtlasKeyChar}${string}`>
  | {
      [K in keyof RA]: K extends string ? (HasNonLeadingHash<K> extends true ? K : never) : never;
    }[keyof RA];

// When the atlas shape RA has issues, getTokenBuilder is brand-typed directly
// (not a callable function). Calling `Class.getTokenBuilder()` then fails with
// TS2349 "This expression is not callable. Type 'RMachineTypeError<…>' has no
// call signatures." — the brand message resolves inline in CLI diagnostics.
// This fires at the getTokenBuilder() call itself (which is canonical, always
// present in atlas declaration files), rather than waiting for a later token()
// invocation. Keeping the class itself structurally valid prevents downstream
// `any` cascades in consumer files.
//
// Reserved-char violations take precedence over dropped-key violations:
// reserved chars are typically the *root cause* of the failure, while the
// dropped-key diagnostic is downstream noise that confuses developers.
type GetTokenBuilderProperty<RA, RD extends AnyResDomain> = [ReservedCharAtlasKeys<RA>] extends [never]
  ? [DroppedAtlasKeys<RA, RD>] extends [never]
    ? () => TokenBuilder<RD>
    : RMachineTypeError<`Invalid namespaces declared in atlas shape (dropped by layout filter): *** ${DroppedAtlasKeys<
        RA,
        RD
      > &
        string} ***`>
  : RMachineTypeError<`Atlas keys use a reserved character in an invalid position. '@' and ':' are fully reserved; '#' is allowed only as the first character (to mark a namespace as internal). Offending keys: ${ReservedCharAtlasKeys<RA> &
      string}`>;

declare const rawResAtlasShapeSymbol: unique symbol;
export type ResAtlasClass<RL extends AnyResLayout, RD extends AnyResDomain, RA = RD> = (abstract new () => ResAtlas<
  RL,
  RD
>) & {
  readonly layout: RL;
  readonly [rawResAtlasShapeSymbol]: RA;
  readonly priority: readonly Namespace<RD>[];

  readonly withPriority: <P extends readonly Namespace<RD>[]>(priority: P) => ResAtlasClass<RL, RD, RA>;

  readonly getTokenBuilder: GetTokenBuilderProperty<RA, RD>;

  readonly loader: ResourceLoader<RL>;
};

export type AnyResAtlasClass = (abstract new () => AnyResAtlas) & {
  readonly layout: AnyResLayout;
  readonly [rawResAtlasShapeSymbol]: AnyResDomain;
  readonly priority: AnyNamespaceList;
  readonly withPriority: (...args: never[]) => AnyResAtlasClass;
  readonly getTokenBuilder: ((...args: never[]) => TokenBuilder<AnyResDomain>) | RMachineTypeError<string>;
  readonly loader: AnyResourceLoader;
};
