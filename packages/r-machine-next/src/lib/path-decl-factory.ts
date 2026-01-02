import type { NonLocalizableSegmentDecl, PathDecl } from "#r-machine/next/core";

export function createPathDecl<const D>(decl: NonLocalizableSegmentDecl<D>): PathDecl<D> {
  return decl as any;
}
