import type { Prettify } from "#r-machine/next/internal";
import type { AnyPathAtlas, AnySegmentKey } from "./path-atlas.js";

type PathAtlasDeclPaths<T> = {
  -readonly [K in keyof T as K extends AnySegmentKey ? K : never]: T[K] extends object
    ? PathAtlasDeclPaths<T[K]>
    : never;
} & {};

type ChildPathSelector<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}` | `${K}${ChildPathSelector<T[K]>}`
          : `${K}`
        : never;
    }[keyof T]
  : never;

// Check if PA or PA["decl"] are any, if so, allow any /${string} path
export type PathSelector<PA extends AnyPathAtlas> = 0 extends 1 & PA
  ? `/${string}`
  : null extends PA["decl"]
    ? `/${string}`
    : "/" | ChildPathSelector<PathAtlasDeclPaths<PA["decl"]>>;

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

// Need both P and O params to properly infer types
export type PathParams<P extends string, O extends PathParamMap<P>> = [keyof O] extends [keyof PathParamMap<P>]
  ? [keyof PathParamMap<P>] extends [keyof O]
    ? Prettify<O>
    : Prettify<PathParamMap<P>>
  : never;

// Need only P param to infer types thanks to the presence of at least one known key (LK)
type BoundPathParams<P extends string, LK extends string> = Prettify<PathParamMap<P> & { [K in LK]?: string }>;

export type BoundPathComposer<PA extends AnyPathAtlas, LK extends string> = <P extends PathSelector<PA>>(
  path: P,
  params?: BoundPathParams<P, LK>
) => string;
