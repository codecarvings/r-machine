import type { AnyPathAtlas, PathParamMap, PathParams, PathSelector } from "./path-atlas.js";

export type BoundPathComposer<PA extends AnyPathAtlas> = <P extends PathSelector<PA>, O extends PathParamMap<P>>(
  path: P,
  params?: PathParams<P, O>
) => string;

type PathComposer<PA extends AnyPathAtlas> = <P extends PathSelector<PA>, O extends PathParamMap<P>>(
  locale: string,
  path: P,
  params?: PathParams<P, O>
) => string;

export interface PathHelper<PA extends AnyPathAtlas> {
  readonly getPath: PathComposer<PA>;
}

export interface HrefHelper<PA extends AnyPathAtlas> {
  readonly getHref: PathComposer<PA>;
}
