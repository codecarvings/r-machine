import type { RMachine } from "r-machine";
import type { ReactNode } from "react";
import { describe, expectTypeOf, it } from "vitest";
import type { ReactBareRMachine, ReactBareToolset } from "../../../src/core/react-bare-toolset.js";
import { createReactBareToolset } from "../../../src/core/react-bare-toolset.js";

type TestAtlas = {
  readonly common: { readonly greeting: string };
  readonly nav: { readonly home: string };
};

// ---------------------------------------------------------------------------
// createReactBareToolset
// ---------------------------------------------------------------------------

describe("createReactBareToolset", () => {
  it("accepts an RMachine and returns a Promise of ReactBareToolset", () => {
    expectTypeOf(createReactBareToolset<TestAtlas>)
      .parameter(0)
      .toEqualTypeOf<RMachine<TestAtlas>>();
    expectTypeOf(createReactBareToolset<TestAtlas>).returns.toEqualTypeOf<Promise<ReactBareToolset<TestAtlas>>>();
  });
});

// ---------------------------------------------------------------------------
// ReactBareToolset
// ---------------------------------------------------------------------------

describe("ReactBareToolset", () => {
  it("has readonly ReactRMachine property", () => {
    expectTypeOf<ReactBareToolset<TestAtlas>["ReactRMachine"]>().toEqualTypeOf<ReactBareRMachine>();
  });

  it("useLocale returns string", () => {
    expectTypeOf<ReactBareToolset<TestAtlas>["useLocale"]>().toEqualTypeOf<() => string>();
  });

  it("useSetLocale returns a function that takes a string and returns Promise<void>", () => {
    expectTypeOf<ReactBareToolset<TestAtlas>["useSetLocale"]>().toEqualTypeOf<
      () => (newLocale: string) => Promise<void>
    >();
  });

  it("useR is parameterized by namespace", () => {
    type UseR = ReactBareToolset<TestAtlas>["useR"];
    expectTypeOf<UseR>().parameter(0).toExtend<"common" | "nav">();
  });

  it("useR rejects namespace arguments not in atlas keys", () => {
    type UseR = ReactBareToolset<TestAtlas>["useR"];
    expectTypeOf<"invalid">().not.toExtend<Parameters<UseR>[0]>();
  });

  it("useR return type is RA[N] for a given namespace", () => {
    type Toolset = ReactBareToolset<TestAtlas>;

    expectTypeOf<Toolset["useR"]>().toExtend<(namespace: "common") => TestAtlas["common"]>();
    expectTypeOf<Toolset["useR"]>().toExtend<(namespace: "nav") => TestAtlas["nav"]>();
  });

  it("useR is a function", () => {
    expectTypeOf<ReactBareToolset<TestAtlas>["useR"]>().toBeFunction();
  });

  it("useRKit is a function", () => {
    expectTypeOf<ReactBareToolset<TestAtlas>["useRKit"]>().toBeFunction();
  });

  it("useRKit accepts namespace arguments constrained to atlas keys", () => {
    type UseRKit = ReactBareToolset<TestAtlas>["useRKit"];
    expectTypeOf<UseRKit>().toBeCallableWith("common");
    expectTypeOf<UseRKit>().toBeCallableWith("common", "nav");
    expectTypeOf<UseRKit>().toExtend<(...args: ["common"]) => unknown>();
    expectTypeOf<UseRKit>().toExtend<(...args: ["common", "nav"]) => unknown>();
  });

  it("useRKit rejects namespace arguments not in atlas keys", () => {
    type UseRKit = ReactBareToolset<TestAtlas>["useRKit"];
    expectTypeOf<UseRKit>().not.toExtend<(...args: ["invalid"]) => unknown>();
    expectTypeOf<UseRKit>().not.toExtend<(...args: ["common", "invalid"]) => unknown>();
  });

  it("has exactly the expected properties", () => {
    expectTypeOf<ReactBareToolset<TestAtlas>>().toHaveProperty("ReactRMachine");
    expectTypeOf<ReactBareToolset<TestAtlas>>().toHaveProperty("useLocale");
    expectTypeOf<ReactBareToolset<TestAtlas>>().toHaveProperty("useSetLocale");
    expectTypeOf<ReactBareToolset<TestAtlas>>().toHaveProperty("useR");
    expectTypeOf<ReactBareToolset<TestAtlas>>().toHaveProperty("useRKit");

    type Keys = keyof ReactBareToolset<TestAtlas>;
    expectTypeOf<Keys>().toEqualTypeOf<"ReactRMachine" | "useLocale" | "useSetLocale" | "useR" | "useRKit">();
  });
});

// ---------------------------------------------------------------------------
// ReactBareRMachine
// ---------------------------------------------------------------------------

describe("ReactBareRMachine", () => {
  it("is callable with locale, children, and optional writeLocale", () => {
    expectTypeOf<ReactBareRMachine>().toBeCallableWith({
      locale: "en",
      children: null as unknown as ReactNode,
    });

    expectTypeOf<ReactBareRMachine>().toBeCallableWith({
      locale: "en",
      writeLocale: async () => {},
      children: null as unknown as ReactNode,
    });
  });

  it("accepts writeLocale returning void (sync)", () => {
    expectTypeOf<ReactBareRMachine>().toBeCallableWith({
      locale: "en",
      writeLocale: () => {},
      children: null as unknown as ReactNode,
    });
  });

  it("accepts writeLocale returning Promise<void> (async)", () => {
    expectTypeOf<ReactBareRMachine>().toBeCallableWith({
      locale: "en",
      writeLocale: async () => {},
      children: null as unknown as ReactNode,
    });
  });

  it("accepts explicitly undefined writeLocale", () => {
    expectTypeOf<ReactBareRMachine>().toBeCallableWith({
      locale: "en",
      writeLocale: undefined,
      children: null as unknown as ReactNode,
    });
  });

  it("returns ReactNode", () => {
    expectTypeOf<ReactBareRMachine>().returns.toExtend<ReactNode>();
  });

  it("has a probe method that accepts string or undefined", () => {
    expectTypeOf<ReactBareRMachine["probe"]>().toBeFunction();
    expectTypeOf<ReactBareRMachine["probe"]>().toBeCallableWith("en");
    expectTypeOf<ReactBareRMachine["probe"]>().toBeCallableWith(undefined);
  });

  it("probe returns string or undefined", () => {
    expectTypeOf<ReactBareRMachine["probe"]>().returns.toEqualTypeOf<string | undefined>();
  });

  it("probe parameter is typed as string | undefined", () => {
    expectTypeOf<ReactBareRMachine["probe"]>().parameter(0).toEqualTypeOf<string | undefined>();
  });
});
