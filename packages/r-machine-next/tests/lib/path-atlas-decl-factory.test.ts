import { describe, expect, it } from "vitest";
import { createPathAtlasDecl } from "../../src/lib/path-atlas-decl-factory.js";

describe("createPathAtlasDecl", () => {
  it("returns the input declaration as-is", () => {
    const decl = { "/about": {} };
    const result = createPathAtlasDecl(decl);
    expect(result).toBe(decl);
  });
});
