type AnySegmentKey = `/${string}`;
type AnyCatchAllSegmentKey = `/[...${string}]`;
type AnyOptionalCatchAllSegmentKey = `/[[...${string}]]`;
type AnyDynamicSegmentKey = `/[${string}]`;

const __error = Symbol("__error");
const __invalidKey = Symbol("__invalidKey");
const __invalidValue = Symbol("__invalidValue");

type DynamicSegment<T> = T extends NonLocalizableSegmentDecl<T> ? T : NonLocalizableSegmentDecl<T>;
type Segment<T> = T extends LocalizableSegmentDecl<T> ? T : LocalizableSegmentDecl<T>;

type EmptyObject = {
  [key: string]: never;
};

export type NonLocalizableSegmentDecl<T> = {
  [K in keyof T]: K extends "/"
    ? { [__error]: "Invalid empty segment key"; [__invalidKey]: K }
    : K extends AnyCatchAllSegmentKey | AnyOptionalCatchAllSegmentKey
      ? T[K] extends EmptyObject
        ? DynamicSegment<T[K]>
        : {
            [__error]: "Catch all segment declarations must be empty objects";
            [__invalidKey]: K;
            [__invalidValue]: T[K];
          }
      : K extends AnyDynamicSegmentKey
        ? T[K] extends object
          ? DynamicSegment<T[K]>
          : { [__error]: "Dynamic segment declarations must be objects"; [__invalidKey]: K; [__invalidValue]: T[K] }
        : K extends AnySegmentKey
          ? T[K] extends object
            ? Segment<T[K]>
            : { [__error]: "Segment declarations must be objects"; [__invalidKey]: K; [__invalidValue]: T[K] }
          : { [__error]: "Unexpected localization. Object keys must match pattern /${string}"; [__invalidKey]: K };
};

export type LocalizableSegmentDecl<T> = {
  [K in keyof T]: K extends "/"
    ? { [__error]: "Invalid empty segment key"; [__invalidKey]: K }
    : K extends AnyCatchAllSegmentKey | AnyOptionalCatchAllSegmentKey
      ? T[K] extends EmptyObject
        ? DynamicSegment<T[K]>
        : {
            [__error]: "Catch all segment declarations must be empty objects";
            [__invalidKey]: K;
            [__invalidValue]: T[K];
          }
      : K extends AnyDynamicSegmentKey
        ? T[K] extends object
          ? DynamicSegment<T[K]>
          : { [__error]: "Dynamic segment declarations must be objects"; [__invalidKey]: K; [__invalidValue]: T[K] }
        : K extends AnySegmentKey
          ? T[K] extends object
            ? Segment<T[K]>
            : { [__error]: "Segment declarations must be objects"; [__invalidKey]: K; [__invalidValue]: T[K] }
          : T[K] extends AnySegmentKey
            ? T[K]
            : {
                [__error]: "Segment localizations must match pattern /${string}";
                [__invalidKey]: K;
                [__invalidValue]: T[K];
              };
};

export type PathDecl<T> = {
  -readonly [K in keyof T as K extends AnySegmentKey ? K : never]: T[K] extends object ? PathDecl<T[K]> : never;
} & {};

// Branded type
const brand = Symbol("PathAtlas");
export class PathAtlas {
  private readonly [brand]?: "PathAtlas";

  constructor(readonly decl: object) {
    void this[brand];
  }
}

type ChildPathSelector<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}` | `${K}${ChildPathSelector<T[K]>}`
          : `${K}`
        : never;
    }[keyof T]
  : never;

export type PathSelector<PA extends PathAtlas> = "/" | ChildPathSelector<PA["decl"]>;

/**
 * Recursively parses a path string and extracts parameter types from dynamic segments.
 * - `/[param]` -> `{ param?: string }`
 * - `/[...param]` -> `{ param?: string[] }`
 * - `/[[...param]]` -> `{ param?: string[] }`
 */
export type PathParamMap<P extends string> = P extends `/${infer First}/${infer Rest}`
  ? (First extends `[...${infer Name}]`
      ? { [K in Name]?: string[] }
      : First extends `[[...${infer Name}]]`
        ? { [K in Name]?: string[] }
        : First extends `[${infer Name}]`
          ? { [K in Name]?: string }
          : {}) &
      PathParamMap<`/${Rest}`>
  : P extends `/${infer Last}`
    ? Last extends `[...${infer Name}]`
      ? { [K in Name]?: string[] }
      : Last extends `[[...${infer Name}]]`
        ? { [K in Name]?: string[] }
        : Last extends `[${infer Name}]`
          ? { [K in Name]?: string }
          : {}
    : {};

type Prettify<T> = { [K in keyof T]: T[K] } & {};
export type PathParams<P extends string, O extends PathParamMap<P>> = [keyof O] extends [keyof PathParamMap<P>]
  ? [keyof PathParamMap<P>] extends [keyof O]
    ? Prettify<O>
    : Prettify<PathParamMap<P>>
  : never;
