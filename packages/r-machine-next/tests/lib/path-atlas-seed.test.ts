import { describe, expect, it } from "vitest";
import { PathAtlasSeed } from "../../src/lib/path-atlas-seed.js";

describe("PathAtlasSeed", () => {
  describe("create", () => {
    it("returns a class whose instances expose the declaration as decl", () => {
      const decl = { "/about": {} };
      const Ctor = PathAtlasSeed.create(decl);
      const instance = new Ctor();
      expect(instance.decl).toBe(decl);
    });

    it("returned class can be extended", () => {
      const Base = PathAtlasSeed.create({ "/about": {} });
      class MyAtlas extends Base {}
      const instance = new MyAtlas();
      expect(instance.decl).toEqual({ "/about": {} });
    });

    it("each call returns a distinct constructor", () => {
      const decl = { "/about": {} };
      const CtorA = PathAtlasSeed.create(decl);
      const CtorB = PathAtlasSeed.create(decl);
      expect(CtorA).not.toBe(CtorB);
      expect(new CtorA()).not.toBeInstanceOf(CtorB);
    });
  });

  describe("for", () => {
    it("returns an object with a create method", () => {
      const curried = PathAtlasSeed.for();
      expect(curried).toHaveProperty("create");
      expect(typeof curried.create).toBe("function");
    });

    it("create returns a class whose instances expose the declaration as decl", () => {
      const decl = { "/about": { en: "/about-en", it: "/chi-siamo" } } as const;
      const Ctor = PathAtlasSeed.for().create(decl);
      const instance = new Ctor();
      expect(instance.decl).toBe(decl);
    });

    it("returned class can be extended", () => {
      const Base = PathAtlasSeed.for().create({ "/about": {} });
      class MyAtlas extends Base {}
      const instance = new MyAtlas();
      expect(instance.decl).toEqual({ "/about": {} });
    });

    it("each call to for() returns an independent curried seed", () => {
      const curriedA = PathAtlasSeed.for();
      const curriedB = PathAtlasSeed.for();
      expect(curriedA).not.toBe(curriedB);
    });

    it("each curried create call returns a distinct constructor", () => {
      const curried = PathAtlasSeed.for();
      const decl = { "/about": {} };
      const CtorA = curried.create(decl);
      const CtorB = curried.create(decl);
      expect(CtorA).not.toBe(CtorB);
      expect(new CtorA()).not.toBeInstanceOf(CtorB);
    });
  });
});
