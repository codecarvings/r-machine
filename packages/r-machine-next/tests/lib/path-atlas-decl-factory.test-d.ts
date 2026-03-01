import { describe, expectTypeOf, it } from "vitest";
import { createPathAtlasDecl } from "../../src/lib/path-atlas-decl-factory.js";

describe("createPathAtlasDecl", () => {
  it("returns {} for an empty declaration", () => {
    expectTypeOf(createPathAtlasDecl({})).toEqualTypeOf<{}>();
  });

  it("returns the same type as the argument", () => {
    const decl = {
      "/about": {},
      "/contact": {},
      "/users": { "/[id]": {} },
      "/docs": { "/[...slug]": {} },
      "/help": { "/[[...slug]]": {} },
      "/api": { "/v1": { "/users": { "/profile": {} } } },
    } as const;
    expectTypeOf(createPathAtlasDecl(decl)).toEqualTypeOf(decl);
  });
});
