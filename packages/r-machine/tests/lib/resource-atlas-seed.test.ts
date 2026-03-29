import { describe, expect, it } from "vitest";
import { ResourceAtlasSeed } from "../../src/lib/resource-atlas-seed.js";

describe("ResourceAtlasSeed.create", () => {
  it("returns a constructor that can be instantiated", () => {
    const Ctor = ResourceAtlasSeed.create();
    const instance = new Ctor();
    expect(instance).toBeInstanceOf(Ctor);
  });

  it("each call returns an independent constructor", () => {
    const Ctor1 = ResourceAtlasSeed.create();
    const Ctor2 = ResourceAtlasSeed.create();
    expect(Ctor1).not.toBe(Ctor2);
    expect(new Ctor1()).not.toBeInstanceOf(Ctor2);
  });
});
