import { type NonLocalizableSegmentDecl, PathAtlas, type PathDecl } from "#r-machine/next/core";

const defaultStatedPathAtlasName = "App" as const;
type DefaultStatedPathAtlasName = typeof defaultStatedPathAtlasName;

export function createPathAtlas<const T, const N = DefaultStatedPathAtlasName>(
  obj: NonLocalizableSegmentDecl<T>,
  name?: N
) {
  void name;

  type StatedPathAtlas<_N> = PathAtlas & {
    readonly decl: PathDecl<T>;
  };
  const result: StatedPathAtlas<N> = new PathAtlas(obj) as any;
  return result!;
}

/*
export function getPath<PA extends AnyPathAtlas, P extends PathSelector<PA>, O extends PathParamMap<P>>(
  decl: PA,
  path: P,
  params?: PathParams<P, O>
) {}
*/
