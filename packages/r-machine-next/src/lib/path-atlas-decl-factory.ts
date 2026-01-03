import type { NonLocalizableSegmentDecl } from "#r-machine/next/core";

export function createPathAtlasDecl<const D>(decl: NonLocalizableSegmentDecl<D>): unknown extends D ? {} : D {
  return decl as any;
}
