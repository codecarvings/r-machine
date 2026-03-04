import type { RMachine } from "r-machine";
import type { ReactNode } from "react";
import { describe, expectTypeOf, it } from "vitest";
import type { AnyPathAtlas, BoundPathComposer } from "#r-machine/next/core";
import type {
  NextAppClientImpl,
  NextAppClientRMachine,
  NextAppClientToolset,
} from "../../../src/core/app/next-app-client-toolset.js";
import { createNextAppClientToolset } from "../../../src/core/app/next-app-client-toolset.js";
import type { TestAtlas } from "../../_fixtures/mock-machine.js";

type TestPathAtlas = {
  readonly decl: {
    readonly "/about": { readonly it: "/chi-siamo" };
  };
};

// ---------------------------------------------------------------------------
// createNextAppClientToolset
// ---------------------------------------------------------------------------

describe("createNextAppClientToolset", () => {
  it("accepts an RMachine and NextAppClientImpl as parameters", () => {
    expectTypeOf(createNextAppClientToolset<TestAtlas, TestPathAtlas>)
      .parameter(0)
      .toEqualTypeOf<RMachine<TestAtlas>>();
    expectTypeOf(createNextAppClientToolset<TestAtlas, TestPathAtlas>)
      .parameter(1)
      .toEqualTypeOf<NextAppClientImpl>();
  });

  it("returns a Promise of NextAppClientToolset", () => {
    expectTypeOf(createNextAppClientToolset<TestAtlas, TestPathAtlas>).returns.toEqualTypeOf<
      Promise<NextAppClientToolset<TestAtlas, TestPathAtlas>>
    >();
  });
});

// ---------------------------------------------------------------------------
// NextAppClientToolset
// ---------------------------------------------------------------------------

describe("NextAppClientToolset", () => {
  it("has exactly the expected properties", () => {
    expectTypeOf<NextAppClientToolset<TestAtlas, TestPathAtlas>>().toHaveProperty("NextClientRMachine");
    expectTypeOf<NextAppClientToolset<TestAtlas, TestPathAtlas>>().toHaveProperty("useLocale");
    expectTypeOf<NextAppClientToolset<TestAtlas, TestPathAtlas>>().toHaveProperty("useSetLocale");
    expectTypeOf<NextAppClientToolset<TestAtlas, TestPathAtlas>>().toHaveProperty("usePathComposer");
    expectTypeOf<NextAppClientToolset<TestAtlas, TestPathAtlas>>().toHaveProperty("useR");
    expectTypeOf<NextAppClientToolset<TestAtlas, TestPathAtlas>>().toHaveProperty("useRKit");

    type Keys = keyof NextAppClientToolset<TestAtlas, TestPathAtlas>;
    expectTypeOf<Keys>().toEqualTypeOf<
      "NextClientRMachine" | "useLocale" | "useSetLocale" | "usePathComposer" | "useR" | "useRKit"
    >();
  });

  it("does not have ReactRMachine", () => {
    expectTypeOf<NextAppClientToolset<TestAtlas, TestPathAtlas>>().not.toHaveProperty("ReactRMachine");
  });

  it("has readonly NextClientRMachine of type NextAppClientRMachine", () => {
    expectTypeOf<
      NextAppClientToolset<TestAtlas, TestPathAtlas>["NextClientRMachine"]
    >().toEqualTypeOf<NextAppClientRMachine>();
  });

  it("useLocale returns string", () => {
    expectTypeOf<NextAppClientToolset<TestAtlas, TestPathAtlas>["useLocale"]>().toEqualTypeOf<() => string>();
  });

  it("useSetLocale returns a function that takes a string and returns Promise<void>", () => {
    expectTypeOf<NextAppClientToolset<TestAtlas, TestPathAtlas>["useSetLocale"]>().toEqualTypeOf<
      () => (newLocale: string) => Promise<void>
    >();
  });

  it("usePathComposer returns BoundPathComposer<PA>", () => {
    expectTypeOf<NextAppClientToolset<TestAtlas, TestPathAtlas>["usePathComposer"]>().toEqualTypeOf<
      () => BoundPathComposer<TestPathAtlas>
    >();
  });

  it("useR is parameterized by namespace", () => {
    type UseR = NextAppClientToolset<TestAtlas, TestPathAtlas>["useR"];
    expectTypeOf<UseR>().parameter(0).toExtend<"common" | "nav">();
  });

  it("useR rejects namespace arguments not in atlas keys", () => {
    type UseR = NextAppClientToolset<TestAtlas, TestPathAtlas>["useR"];
    expectTypeOf<"invalid">().not.toExtend<Parameters<UseR>[0]>();
  });

  it("useR return type is RA[N] for a given namespace", () => {
    type Toolset = NextAppClientToolset<TestAtlas, TestPathAtlas>;
    expectTypeOf<Toolset["useR"]>().toExtend<(namespace: "common") => TestAtlas["common"]>();
    expectTypeOf<Toolset["useR"]>().toExtend<(namespace: "nav") => TestAtlas["nav"]>();
  });

  it("useRKit accepts namespace arguments constrained to atlas keys", () => {
    type UseRKit = NextAppClientToolset<TestAtlas, TestPathAtlas>["useRKit"];
    expectTypeOf<UseRKit>().toBeCallableWith("common");
    expectTypeOf<UseRKit>().toBeCallableWith("common", "nav");
    expectTypeOf<UseRKit>().toExtend<(...args: ["common"]) => unknown>();
    expectTypeOf<UseRKit>().toExtend<(...args: ["common", "nav"]) => unknown>();
  });

  it("useRKit rejects namespace arguments not in atlas keys", () => {
    type UseRKit = NextAppClientToolset<TestAtlas, TestPathAtlas>["useRKit"];
    expectTypeOf<UseRKit>().not.toExtend<(...args: ["invalid"]) => unknown>();
    expectTypeOf<UseRKit>().not.toExtend<(...args: ["common", "invalid"]) => unknown>();
  });

  it("different atlas types produce different toolset types", () => {
    type OtherAtlas = { readonly other: { readonly value: number } };
    expectTypeOf<NextAppClientToolset<TestAtlas, TestPathAtlas>>().not.toEqualTypeOf<
      NextAppClientToolset<OtherAtlas, TestPathAtlas>
    >();
  });

  it("different path atlas types produce different path selectors", () => {
    type OtherPathAtlas = { readonly decl: { readonly "/contact": {} } };
    type PathSelector = NextAppClientToolset<
      TestAtlas,
      TestPathAtlas
    >["usePathComposer"] extends () => BoundPathComposer<infer PS>
      ? PS
      : never;
    type OtherPathSelector = NextAppClientToolset<
      TestAtlas,
      OtherPathAtlas
    >["usePathComposer"] extends () => BoundPathComposer<infer PS>
      ? PS
      : never;
    expectTypeOf<PathSelector>().not.toEqualTypeOf<OtherPathSelector>();
  });
});

// ---------------------------------------------------------------------------
// NextAppClientRMachine
// ---------------------------------------------------------------------------

describe("NextAppClientRMachine", () => {
  it("is callable with locale and children", () => {
    expectTypeOf<NextAppClientRMachine>().toBeCallableWith({
      locale: "en",
      children: null as unknown as ReactNode,
    });
  });

  it("returns ReactNode", () => {
    expectTypeOf<NextAppClientRMachine>().returns.toExtend<ReactNode>();
  });
});

// ---------------------------------------------------------------------------
// NextAppClientImpl
// ---------------------------------------------------------------------------

describe("NextAppClientImpl", () => {
  it("has onLoad, writeLocale, and createUsePathComposer properties", () => {
    expectTypeOf<NextAppClientImpl>().toHaveProperty("onLoad");
    expectTypeOf<NextAppClientImpl>().toHaveProperty("writeLocale");
    expectTypeOf<NextAppClientImpl>().toHaveProperty("createUsePathComposer");
  });

  it("onLoad can be undefined", () => {
    expectTypeOf<undefined>().toExtend<NextAppClientImpl["onLoad"]>();
  });

  it("onLoad can be a function returning void", () => {
    expectTypeOf<(locale: string) => void>().toExtend<NonNullable<NextAppClientImpl["onLoad"]>>();
  });

  it("onLoad can be a function returning a cleanup function", () => {
    expectTypeOf<(locale: string) => () => void>().toExtend<NonNullable<NextAppClientImpl["onLoad"]>>();
  });

  it("writeLocale accepts locale as first parameter", () => {
    expectTypeOf<NextAppClientImpl["writeLocale"]>().parameter(0).toBeString();
  });

  it("writeLocale accepts newLocale as second parameter", () => {
    expectTypeOf<NextAppClientImpl["writeLocale"]>().parameter(1).toBeString();
  });

  it("writeLocale accepts pathname as third parameter", () => {
    expectTypeOf<NextAppClientImpl["writeLocale"]>().parameter(2).toBeString();
  });

  it("writeLocale returns void or Promise<void>", () => {
    expectTypeOf<NextAppClientImpl["writeLocale"]>().returns.toEqualTypeOf<void | Promise<void>>();
  });

  it("createUsePathComposer accepts a useLocale function and returns a hook", () => {
    expectTypeOf<NextAppClientImpl["createUsePathComposer"]>().parameter(0).toEqualTypeOf<() => string>();
    expectTypeOf<NextAppClientImpl["createUsePathComposer"]>().returns.toEqualTypeOf<
      () => BoundPathComposer<AnyPathAtlas>
    >();
  });
});
