/** biome-ignore-all lint/suspicious/noExplicitAny: intentional for testing any-guard branches */
/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: intentional use of template literal types */

import { describe, expectTypeOf, it } from "vitest";
import type { BoundPathComposer, PathParamMap, PathParams, PathSelector } from "#r-machine/next/core";

// ──────────────────────────────────────────────────────────
// Test fixtures
// ──────────────────────────────────────────────────────────

type EmptyDeclAtlas = { readonly decl: {} };

type FlatAtlas = {
  readonly decl: {
    readonly "/about": {};
    readonly "/contact": {};
  };
};

type NestedAtlas = {
  readonly decl: {
    readonly "/about": {
      readonly "/team": {
        readonly "/leads": {};
      };
    };
    readonly "/products": {
      readonly "/[id]": {};
    };
  };
};

type TranslatedAtlas = {
  readonly decl: {
    readonly "/about": { readonly it: "/chi-siamo"; readonly es: "/acerca-de" };
    readonly "/products": {
      readonly it: "/prodotti";
      readonly "/[id]": {};
    };
  };
};

type DynamicAtlas = {
  readonly decl: {
    readonly "/users": {
      readonly "/[userId]": {
        readonly "/posts": {
          readonly "/[postId]": {};
        };
      };
    };
  };
};

type CatchAllAtlas = {
  readonly decl: {
    readonly "/docs": { readonly "/[...slug]": {} };
    readonly "/files": { readonly "/[[...path]]": {} };
  };
};

// ──────────────────────────────────────────────────────────
// PathSelector
// ──────────────────────────────────────────────────────────

describe("PathSelector", () => {
  describe("any-guard: produces `/${string}` when PAP is any", () => {
    it("falls back to `/${string}`", () => {
      type Result = PathSelector<any>;
      expectTypeOf<Result>().toEqualTypeOf<`/${string}`>();
    });
  });

  describe("with empty decl", () => {
    it("only allows root path", () => {
      type Result = PathSelector<EmptyDeclAtlas>;
      expectTypeOf<"/">().toExtend<Result>();
    });

    it("rejects non-root paths", () => {
      type Result = PathSelector<EmptyDeclAtlas>;
      expectTypeOf<"/anything">().not.toExtend<Result>();
    });
  });

  describe("with flat segments", () => {
    it("includes root and all declared paths", () => {
      type Result = PathSelector<FlatAtlas>;
      expectTypeOf<"/">().toExtend<Result>();
      expectTypeOf<"/about">().toExtend<Result>();
      expectTypeOf<"/contact">().toExtend<Result>();
    });

    it("rejects undeclared paths", () => {
      type Result = PathSelector<FlatAtlas>;
      expectTypeOf<"/missing">().not.toExtend<Result>();
    });
  });

  describe("with deeply nested segments (3+ levels)", () => {
    it("includes all levels of nesting", () => {
      type Result = PathSelector<NestedAtlas>;
      expectTypeOf<"/">().toExtend<Result>();
      expectTypeOf<"/about">().toExtend<Result>();
      expectTypeOf<"/about/team">().toExtend<Result>();
      expectTypeOf<"/about/team/leads">().toExtend<Result>();
      expectTypeOf<"/products">().toExtend<Result>();
      expectTypeOf<"/products/[id]">().toExtend<Result>();
    });

    it("rejects paths beyond declared depth", () => {
      type Result = PathSelector<NestedAtlas>;
      expectTypeOf<"/about/team/leads/extra">().not.toExtend<Result>();
      expectTypeOf<"/products/[id]/extra">().not.toExtend<Result>();
    });

    it("rejects partially matching paths at wrong level", () => {
      type Result = PathSelector<NestedAtlas>;
      expectTypeOf<"/about/wrong">().not.toExtend<Result>();
      expectTypeOf<"/about/team/wrong">().not.toExtend<Result>();
    });
  });

  describe("filters translation keys from paths", () => {
    it("includes segment keys only", () => {
      type Result = PathSelector<TranslatedAtlas>;
      expectTypeOf<"/">().toExtend<Result>();
      expectTypeOf<"/about">().toExtend<Result>();
      expectTypeOf<"/products">().toExtend<Result>();
      expectTypeOf<"/products/[id]">().toExtend<Result>();
    });

    it("excludes translation values from appearing as paths", () => {
      type Result = PathSelector<TranslatedAtlas>;
      expectTypeOf<"/chi-siamo">().not.toExtend<Result>();
      expectTypeOf<"/prodotti">().not.toExtend<Result>();
      expectTypeOf<"/acerca-de">().not.toExtend<Result>();
    });

    it("excludes locale keys from appearing as nested segments", () => {
      type Result = PathSelector<TranslatedAtlas>;
      expectTypeOf<"/about/it">().not.toExtend<Result>();
      expectTypeOf<"/about/es">().not.toExtend<Result>();
      expectTypeOf<"/products/it">().not.toExtend<Result>();
    });
  });

  describe("with dynamic segments", () => {
    it("includes full dynamic path hierarchy", () => {
      type Result = PathSelector<DynamicAtlas>;
      expectTypeOf<"/users">().toExtend<Result>();
      expectTypeOf<"/users/[userId]">().toExtend<Result>();
      expectTypeOf<"/users/[userId]/posts">().toExtend<Result>();
      expectTypeOf<"/users/[userId]/posts/[postId]">().toExtend<Result>();
    });

    it("rejects paths beyond declared dynamic segments", () => {
      type Result = PathSelector<DynamicAtlas>;
      expectTypeOf<"/users/[userId]/posts/[postId]/extra">().not.toExtend<Result>();
    });
  });

  describe("with catch-all segments", () => {
    it("includes catch-all segment keys", () => {
      type Result = PathSelector<CatchAllAtlas>;
      expectTypeOf<"/docs">().toExtend<Result>();
      expectTypeOf<"/docs/[...slug]">().toExtend<Result>();
    });

    it("includes optional catch-all segment keys", () => {
      type Result = PathSelector<CatchAllAtlas>;
      expectTypeOf<"/files">().toExtend<Result>();
      expectTypeOf<"/files/[[...path]]">().toExtend<Result>();
    });
  });
});

// ──────────────────────────────────────────────────────────
// PathParamMap
// ──────────────────────────────────────────────────────────

describe("PathParamMap", () => {
  describe("static paths", () => {
    it("returns empty object for root path", () => {
      expectTypeOf<PathParamMap<"/">>().toEqualTypeOf<{}>();
    });

    it("returns empty object for single static segment", () => {
      expectTypeOf<PathParamMap<"/about">>().toEqualTypeOf<{}>();
    });

    it("returns empty object for multiple static segments", () => {
      expectTypeOf<PathParamMap<"/about/team/leads">>().toEqualTypeOf<{}>();
    });

    it("returns empty object for empty string", () => {
      expectTypeOf<PathParamMap<"">>().toEqualTypeOf<{}>();
    });
  });

  describe("single [param] segment", () => {
    it("extracts as string when it is the only segment", () => {
      expectTypeOf<PathParamMap<"/[id]">>().toEqualTypeOf<{ id: string }>();
    });

    it("extracts as string from nested position", () => {
      expectTypeOf<PathParamMap<"/users/[id]">>().toEqualTypeOf<{ id: string }>();
    });

    it("extracts as string from leading position", () => {
      type Result = PathParamMap<"/[locale]/about">;
      expectTypeOf<keyof Result>().toEqualTypeOf<"locale">();
      expectTypeOf<Result["locale"]>().toBeString();
    });
  });

  describe("catch-all [...param] segment", () => {
    it("extracts as string[] when it is the only segment", () => {
      expectTypeOf<PathParamMap<"/[...slug]">>().toEqualTypeOf<{ slug: string[] }>();
    });

    it("extracts as string[] from nested position", () => {
      expectTypeOf<PathParamMap<"/docs/[...slug]">>().toEqualTypeOf<{ slug: string[] }>();
    });
  });

  describe("optional catch-all [[...param]] segment", () => {
    it("extracts as string[] when it is the only segment", () => {
      expectTypeOf<PathParamMap<"/[[...slug]]">>().toEqualTypeOf<{ slug: string[] }>();
    });

    it("extracts as string[] from nested position", () => {
      expectTypeOf<PathParamMap<"/docs/[[...slug]]">>().toEqualTypeOf<{ slug: string[] }>();
    });
  });

  describe("multiple dynamic segments", () => {
    it("extracts all params from consecutive dynamic segments", () => {
      type Result = PathParamMap<"/[a]/[b]">;
      expectTypeOf<keyof Result>().toEqualTypeOf<"a" | "b">();
      expectTypeOf<Result["a"]>().toBeString();
      expectTypeOf<Result["b"]>().toBeString();
    });

    it("extracts all params with static segments interleaved", () => {
      type Result = PathParamMap<"/users/[userId]/posts/[postId]">;
      expectTypeOf<keyof Result>().toEqualTypeOf<"userId" | "postId">();
      expectTypeOf<Result["userId"]>().toBeString();
      expectTypeOf<Result["postId"]>().toBeString();
    });

    it("extracts mixed [param] and [...param] types", () => {
      type Result = PathParamMap<"/users/[userId]/files/[...path]">;
      expectTypeOf<keyof Result>().toEqualTypeOf<"userId" | "path">();
      expectTypeOf<Result["userId"]>().toBeString();
      expectTypeOf<Result["path"]>().toEqualTypeOf<string[]>();
    });

    it("extracts from leading and trailing dynamic segments around static", () => {
      type Result = PathParamMap<"/[locale]/users/[id]">;
      expectTypeOf<keyof Result>().toEqualTypeOf<"locale" | "id">();
      expectTypeOf<Result["locale"]>().toBeString();
      expectTypeOf<Result["id"]>().toBeString();
    });

    it("extracts params with trailing static segment", () => {
      type Result = PathParamMap<"/shop/[category]/items/[itemId]/reviews">;
      expectTypeOf<keyof Result>().toEqualTypeOf<"category" | "itemId">();
      expectTypeOf<Result["category"]>().toBeString();
      expectTypeOf<Result["itemId"]>().toBeString();
    });
  });
});

// ──────────────────────────────────────────────────────────
// PathParams
// ──────────────────────────────────────────────────────────

describe("PathParams", () => {
  it("returns Prettified params when O keys match PathParamMap exactly", () => {
    type Result = PathParams<"/users/[id]", { id: string }>;
    expectTypeOf<Result>().toEqualTypeOf<{ id: string }>();
  });

  it("returns empty object for static paths", () => {
    type Result = PathParams<"/about", {}>;
    expectTypeOf<Result>().toEqualTypeOf<{}>();
  });

  it("flattens intersection types from multi-segment params", () => {
    type P = "/users/[userId]/posts/[postId]";
    type Result = PathParams<P, PathParamMap<P>>;
    expectTypeOf<Result>().toEqualTypeOf<{ userId: string; postId: string }>();
  });

  it("preserves catch-all string[] types", () => {
    type P = "/docs/[...slug]";
    type Result = PathParams<P, { slug: string[] }>;
    expectTypeOf<Result>().toEqualTypeOf<{ slug: string[] }>();
  });

  it("preserves mixed [param] and [...param] types", () => {
    type P = "/users/[id]/files/[...path]";
    type Result = PathParams<P, PathParamMap<P>>;
    expectTypeOf<Result>().toEqualTypeOf<{ id: string; path: string[] }>();
  });

  it("returns never when O has extraneous keys beyond PathParamMap", () => {
    type Result = PathParams<"/users/[id]", { id: string; extra: number }>;
    expectTypeOf<Result>().toBeNever();
  });
});

// ──────────────────────────────────────────────────────────
// BoundPathComposer
// ──────────────────────────────────────────────────────────

describe("BoundPathComposer", () => {
  it("is a function type", () => {
    expectTypeOf<BoundPathComposer<FlatAtlas>>().toBeFunction();
  });

  it("returns string when called with a valid static path", () => {
    const compose = null as unknown as BoundPathComposer<FlatAtlas>;
    expectTypeOf(compose("/about")).toBeString();
    expectTypeOf(compose("/")).toBeString();
  });

  it("makes params optional for static paths (no dynamic segments)", () => {
    const compose = null as unknown as BoundPathComposer<FlatAtlas>;
    expectTypeOf(compose("/about")).toBeString();
  });

  it("requires params for paths with dynamic segments", () => {
    const compose = null as unknown as BoundPathComposer<DynamicAtlas>;
    expectTypeOf(compose("/users/[userId]/posts/[postId]", { userId: "1", postId: "2" })).toBeString();
    // @ts-expect-error - params required for dynamic paths
    compose("/users/[userId]/posts/[postId]");
  });

  it("returns string when PAP is any", () => {
    const compose = null as unknown as BoundPathComposer<any>;
    expectTypeOf(compose("/anything")).toBeString();
  });
});
