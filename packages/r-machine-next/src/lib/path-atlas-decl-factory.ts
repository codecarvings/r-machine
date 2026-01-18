import type { NonTranslatableSegmentDecl } from "#r-machine/next/core";

export function createPathAtlasDecl<const D>(decl: NonTranslatableSegmentDecl<D>): unknown extends D ? {} : D {
  return decl as any;
}
