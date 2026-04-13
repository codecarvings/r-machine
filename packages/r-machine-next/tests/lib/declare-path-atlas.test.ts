import { describe, expect, it } from "vitest";
import { declarePathAtlas } from "../../src/lib/declare-path-atlas.js";

describe("declarePathAtlas", () => {
  it("returns an object with an as method", () => {
    const declared = declarePathAtlas();
    expect(declared).toHaveProperty("as");
    expect(typeof declared.as).toBe("function");
  });

  it("as returns a class whose instances expose the declaration as segment", () => {
    const decl = { "/about": {} };
    const Ctor = declarePathAtlas().as(decl);
    const instance = new Ctor();
    expect(instance.segment).toBe(decl);
  });

  it("returned class can be extended", () => {
    const Base = declarePathAtlas().as({ "/about": {} });
    class MyAtlas extends Base {}
    const instance = new MyAtlas();
    expect(instance.segment).toEqual({ "/about": {} });
  });

  it("each call returns a distinct constructor", () => {
    const decl = { "/about": {} };
    const CtorA = declarePathAtlas().as(decl);
    const CtorB = declarePathAtlas().as(decl);
    expect(CtorA).not.toBe(CtorB);
    expect(new CtorA()).not.toBeInstanceOf(CtorB);
  });

  it("each call to declarePathAtlas() returns an independent object", () => {
    const declaredA = declarePathAtlas();
    const declaredB = declarePathAtlas();
    expect(declaredA).not.toBe(declaredB);
  });

});
