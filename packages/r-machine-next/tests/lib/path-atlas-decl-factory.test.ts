import { describe, expect, it } from "vitest";
import { PathAtlasSeed } from "../../src/lib/path-atlas-decl-factory.js";

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
  });
});
