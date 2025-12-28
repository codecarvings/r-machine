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

const brand = Symbol("AppPaths");
class DeclaredPathsBrand {
  protected readonly [brand]?: "AppPaths";
}

export function declarePaths<const T, const N = "App">(obj: NonLocalizableSegmentDecl<T>, name?: N) {
  void name;

  type DeclaredPaths<_N> = PathDecl<T> & DeclaredPathsBrand;
  const result: DeclaredPaths<N> = undefined!;
  return result!;
}

type PathSelector<T> = T extends object
  ? {
      [K in keyof T]: K extends string ? (T[K] extends object ? `${K}` | `${K}${PathSelector<T[K]>}` : `${K}`) : never;
    }[keyof T]
  : never;

type RootPathSelector<T> = "/" | PathSelector<T>;

export function getPath<T>(decl: T, path: RootPathSelector<T>) {}
