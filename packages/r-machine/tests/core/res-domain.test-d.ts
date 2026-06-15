import { describe, expectTypeOf, it } from "vitest";
import type { ExtractNamespace, Handle, Namespace, Token, TokenBuilder } from "../../src/core/res-domain.js";
import { createToken } from "../../src/core/res-domain.js";

// Type-level contracts of the token system (the runtime strip behaviour is
// covered in res-domain.test.ts / res-collections.test.ts).
type RD = { "base/a": unknown; "outer/b": unknown };

describe("Namespace<RD>", () => {
  it("is the string-keyed namespaces of the domain", () => {
    expectTypeOf<Namespace<RD>>().toEqualTypeOf<"base/a" | "outer/b">();
  });
});

describe("Token / ExtractNamespace", () => {
  it("createToken<N> produces a Token preserving the literal namespace", () => {
    expectTypeOf(createToken("base/a")).toEqualTypeOf<Token<"base/a">>();
  });

  it("ExtractNamespace unwraps a Token to its namespace", () => {
    expectTypeOf<ExtractNamespace<Token<"base/a">>>().toEqualTypeOf<"base/a">();
  });

  it("ExtractNamespace passes a bare string handle through unchanged", () => {
    expectTypeOf<ExtractNamespace<"base/a">>().toEqualTypeOf<"base/a">();
  });
});

describe("Handle<RD>", () => {
  it("is a namespace of RD or a Token of one", () => {
    expectTypeOf<Handle<RD>>().toEqualTypeOf<"base/a" | "outer/b" | Token<"base/a" | "outer/b">>();
  });
});

describe("TokenBuilder<RD>", () => {
  it("accepts only namespaces of RD and returns a matching Token", () => {
    const build = {} as TokenBuilder<RD>;
    expectTypeOf(build("base/a")).toEqualTypeOf<Token<"base/a">>();
    // @ts-expect-error - "nope" is not a namespace of RD
    build("nope");
  });
});
