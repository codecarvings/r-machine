import { describe, expectTypeOf, it } from "vitest";
import type { RCtx } from "../../src/lib/r-ctx.js";

describe("RCtx", () => {
  it("should have readonly locale property", () => {
    expectTypeOf<RCtx<"en" | "it", {}>>().toHaveProperty("locale").toEqualTypeOf<"en" | "it">();
  });

  it("should have readonly kit property", () => {
    type Kit = { readonly common: { greeting: string } };
    expectTypeOf<RCtx<string, Kit>>().toHaveProperty("kit").toEqualTypeOf<Kit>();
  });

  it("should have exactly two properties", () => {
    type Keys = keyof RCtx<string, {}>;
    expectTypeOf<Keys>().toEqualTypeOf<"locale" | "kit">();
  });

  it("should propagate locale type parameter", () => {
    expectTypeOf<RCtx<"en", {}>["locale"]>().toEqualTypeOf<"en">();
    expectTypeOf<RCtx<string, {}>["locale"]>().toEqualTypeOf<string>();
  });

  it("should propagate kit type parameter", () => {
    type Kit = { readonly nav: { home: string }; readonly footer: { copyright: string } };
    type Ctx = RCtx<string, Kit>;
    expectTypeOf<Ctx["kit"]["nav"]>().toEqualTypeOf<{ home: string }>();
    expectTypeOf<Ctx["kit"]["footer"]>().toEqualTypeOf<{ copyright: string }>();
  });

  it("narrow locale RCtx should be assignable to wider locale RCtx", () => {
    expectTypeOf<RCtx<"en", {}>>().toExtend<RCtx<"en" | "it", {}>>();
    expectTypeOf<RCtx<"en" | "it", {}>>().toExtend<RCtx<string, {}>>();
  });

  it("wider locale RCtx should NOT be assignable to narrower locale RCtx", () => {
    expectTypeOf<RCtx<string, {}>>().not.toExtend<RCtx<"en" | "it", {}>>();
  });
});
