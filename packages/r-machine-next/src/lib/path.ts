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

type NonLocalizableSegmentDecl<T> = {
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

type LocalizableSegmentDecl<T> = {
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

type PathDecl<T> = {
  -readonly [K in keyof T as K extends AnySegmentKey ? K : never]: T[K] extends object ? PathDecl<T[K]> : never;
} & {};

// Branded type
const brand = Symbol("PathAtlas");
class PathAtlasCore {
  protected readonly [brand]?: "PathAtlas";
  readonly decl: unknown;
}

export function createPathAtlas<const T, const N = "App">(obj: NonLocalizableSegmentDecl<T>, name?: N) {
  void name;

  type PathAtlas<_N> = PathAtlasCore & {
    decl: PathDecl<T>;
  };
  const result: PathAtlas<N> = {
    decl: obj as any,
  };
  return result!;
}

type PathSelector<T> = T extends object
  ? {
      [K in keyof T]: K extends string ? (T[K] extends object ? `${K}` | `${K}${PathSelector<T[K]>}` : `${K}`) : never;
    }[keyof T]
  : never;

type RootPathSelector<T> = "/" | PathSelector<T>;

/**
 * Recursively parses a path string and extracts parameter types from dynamic segments.
 * - `/[param]` -> `{ param?: string }`
 * - `/[...param]` -> `{ param?: string[] }`
 * - `/[[...param]]` -> `{ param?: string[] }`
 */
type ParamMap<P extends string> = P extends `/${infer First}/${infer Rest}`
  ? (First extends `[...${infer Name}]`
      ? { [K in Name]?: string[] }
      : First extends `[[...${infer Name}]]`
        ? { [K in Name]?: string[] }
        : First extends `[${infer Name}]`
          ? { [K in Name]?: string }
          : {}) &
      ParamMap<`/${Rest}`>
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

type Params<P extends string, O extends ParamMap<P>> = [keyof O] extends [keyof ParamMap<P>]
  ? [keyof ParamMap<P>] extends [keyof O]
    ? Prettify<O>
    : Prettify<ParamMap<P>>
  : never;

export function getPath<T extends PathAtlasCore, P extends RootPathSelector<T["decl"]>, O extends ParamMap<P>>(
  decl: T,
  path: P,
  params?: Params<P, O>
) {}
