import { describe, expectTypeOf, it } from "vitest";
import type { RCtx } from "../../src/lib/r-module.js";
import { ResourceAtlasSeed } from "../../src/lib/resource-atlas-seed.js";

type TestAtlas = {
  readonly common: { greeting: string };
  readonly home: { title: string };
};

describe("ResourceAtlasSeed.create", () => {
  it("should return a constructible type whose instance matches the atlas shape", () => {
    const Ctor = ResourceAtlasSeed.create<TestAtlas>();
    expectTypeOf(Ctor).toBeConstructibleWith();
    expectTypeOf(new Ctor()).toEqualTypeOf<TestAtlas>();
  });

  it("should preserve namespace-level R types including factories", () => {
    type AtlasWithFactory = {
      readonly sync: { greeting: string };
      readonly lazy: ($: RCtx) => Promise<{ title: string }>;
    };
    const Ctor = ResourceAtlasSeed.create<AtlasWithFactory>();
    type Instance = InstanceType<typeof Ctor>;
    expectTypeOf<Instance["sync"]>().toEqualTypeOf<{ greeting: string }>();
    expectTypeOf<Instance["lazy"]>().toEqualTypeOf<($: RCtx) => Promise<{ title: string }>>();
  });
});
