import type { RMachine } from "r-machine";
import type { ReactNode } from "react";
import { describe, expectTypeOf, it } from "vitest";
import type { AnyPathAtlas, BoundPathComposer, RMachineProxy } from "#r-machine/next/core";
import type { CookiesFn, HeadersFn } from "#r-machine/next/internal";
import type { NextAppClientRMachine } from "../../../src/core/app/next-app-client-toolset.js";
import type {
  NextAppServerImpl,
  NextAppServerRMachine,
  NextAppServerToolset,
} from "../../../src/core/app/next-app-server-toolset.js";
import { createNextAppServerToolset } from "../../../src/core/app/next-app-server-toolset.js";
import type { TestAtlas } from "../../_fixtures/mock-machine.js";

type TestPathAtlas = {
  readonly decl: {
    readonly "/about": { readonly it: "/chi-siamo" };
  };
};

// ---------------------------------------------------------------------------
// createNextAppServerToolset
// ---------------------------------------------------------------------------

describe("createNextAppServerToolset", () => {
  it("accepts RMachine, NextAppServerImpl, and NextAppClientRMachine as parameters", () => {
    expectTypeOf(createNextAppServerToolset<TestAtlas, TestPathAtlas, "locale">)
      .parameter(0)
      .toEqualTypeOf<RMachine<TestAtlas>>();
    expectTypeOf(createNextAppServerToolset<TestAtlas, TestPathAtlas, "locale">)
      .parameter(1)
      .toEqualTypeOf<NextAppServerImpl>();
    expectTypeOf(createNextAppServerToolset<TestAtlas, TestPathAtlas, "locale">)
      .parameter(2)
      .toEqualTypeOf<NextAppClientRMachine>();
  });

  it("returns a Promise of NextAppServerToolset", () => {
    expectTypeOf(createNextAppServerToolset<TestAtlas, TestPathAtlas, "locale">).returns.toEqualTypeOf<
      Promise<NextAppServerToolset<TestAtlas, TestPathAtlas, "locale">>
    >();
  });
});

// ---------------------------------------------------------------------------
// NextAppServerToolset
// ---------------------------------------------------------------------------

describe("NextAppServerToolset", () => {
  type Toolset = NextAppServerToolset<TestAtlas, TestPathAtlas, "locale">;

  it("has exactly the expected properties", () => {
    expectTypeOf<Toolset>().toHaveProperty("rMachineProxy");
    expectTypeOf<Toolset>().toHaveProperty("NextServerRMachine");
    expectTypeOf<Toolset>().toHaveProperty("generateLocaleStaticParams");
    expectTypeOf<Toolset>().toHaveProperty("bindLocale");
    expectTypeOf<Toolset>().toHaveProperty("getLocale");
    expectTypeOf<Toolset>().toHaveProperty("setLocale");
    expectTypeOf<Toolset>().toHaveProperty("pickR");
    expectTypeOf<Toolset>().toHaveProperty("pickRKit");
    expectTypeOf<Toolset>().toHaveProperty("getPathComposer");

    type Keys = keyof Toolset;
    expectTypeOf<Keys>().toEqualTypeOf<
      | "rMachineProxy"
      | "NextServerRMachine"
      | "generateLocaleStaticParams"
      | "bindLocale"
      | "getLocale"
      | "setLocale"
      | "pickR"
      | "pickRKit"
      | "getPathComposer"
    >();
  });

  it("rMachineProxy is RMachineProxy", () => {
    expectTypeOf<Toolset["rMachineProxy"]>().toEqualTypeOf<RMachineProxy>();
  });

  it("NextServerRMachine is NextAppServerRMachine", () => {
    expectTypeOf<Toolset["NextServerRMachine"]>().toEqualTypeOf<NextAppServerRMachine>();
  });

  it("generateLocaleStaticParams returns a Promise of locale param arrays", () => {
    expectTypeOf<Toolset["generateLocaleStaticParams"]>().toEqualTypeOf<() => Promise<{ locale: string }[]>>();
  });

  it("generateLocaleStaticParams return type changes with the locale key", () => {
    type Toolset1 = NextAppServerToolset<TestAtlas, TestPathAtlas, "locale">;
    type Toolset2 = NextAppServerToolset<TestAtlas, TestPathAtlas, "lang">;

    expectTypeOf<Toolset1["generateLocaleStaticParams"]>().toEqualTypeOf<() => Promise<{ locale: string }[]>>();
    expectTypeOf<Toolset2["generateLocaleStaticParams"]>().toEqualTypeOf<() => Promise<{ lang: string }[]>>();
  });

  it("getLocale returns Promise<string>", () => {
    expectTypeOf<Toolset["getLocale"]>().toEqualTypeOf<() => Promise<string>>();
  });

  it("setLocale accepts a string and returns Promise<void>", () => {
    expectTypeOf<Toolset["setLocale"]>().toEqualTypeOf<(newLocale: string) => Promise<void>>();
  });

  it("getPathComposer returns Promise<BoundPathComposer<PA>>", () => {
    expectTypeOf<Toolset["getPathComposer"]>().toEqualTypeOf<() => Promise<BoundPathComposer<TestPathAtlas>>>();
  });

  // -----------------------------------------------------------------------
  // pickR
  // -----------------------------------------------------------------------

  it("pickR is parameterized by namespace", () => {
    type PickR = Toolset["pickR"];
    expectTypeOf<PickR>().parameter(0).toExtend<"common" | "nav">();
  });

  it("pickR rejects namespace arguments not in atlas keys", () => {
    type PickR = Toolset["pickR"];
    expectTypeOf<"invalid">().not.toExtend<Parameters<PickR>[0]>();
  });

  it("pickR return type is Promise<RA[N]> for a given namespace", () => {
    expectTypeOf<Toolset["pickR"]>().toExtend<(namespace: "common") => Promise<TestAtlas["common"]>>();
    expectTypeOf<Toolset["pickR"]>().toExtend<(namespace: "nav") => Promise<TestAtlas["nav"]>>();
  });

  // -----------------------------------------------------------------------
  // pickRKit
  // -----------------------------------------------------------------------

  it("pickRKit accepts namespace arguments constrained to atlas keys", () => {
    type PickRKit = Toolset["pickRKit"];
    expectTypeOf<PickRKit>().toBeCallableWith("common");
    expectTypeOf<PickRKit>().toBeCallableWith("common", "nav");
    expectTypeOf<PickRKit>().toExtend<(...args: ["common"]) => unknown>();
    expectTypeOf<PickRKit>().toExtend<(...args: ["common", "nav"]) => unknown>();
  });

  it("pickRKit rejects namespace arguments not in atlas keys", () => {
    type PickRKit = Toolset["pickRKit"];
    expectTypeOf<PickRKit>().not.toExtend<(...args: ["invalid"]) => unknown>();
    expectTypeOf<PickRKit>().not.toExtend<(...args: ["common", "invalid"]) => unknown>();
  });

  it("pickRKit return type is Promise<RKit> for given namespaces", () => {
    const pickRKit = {} as Toolset["pickRKit"];

    expectTypeOf(pickRKit("common")).toEqualTypeOf<Promise<readonly [TestAtlas["common"]]>>();
    expectTypeOf(pickRKit("common", "nav")).toEqualTypeOf<Promise<readonly [TestAtlas["common"], TestAtlas["nav"]]>>();
  });

  // -----------------------------------------------------------------------
  // bindLocale
  // -----------------------------------------------------------------------

  it("bindLocale accepts a string and returns string", () => {
    expectTypeOf<Toolset["bindLocale"]>().toBeCallableWith("en");
    expectTypeOf<Toolset["bindLocale"]>().toExtend<(locale: string) => string>();
  });

  it("bindLocale accepts a Promise of params and returns a Promise of params", () => {
    type Params = { locale: string };
    expectTypeOf<Toolset["bindLocale"]>().toBeCallableWith(Promise.resolve({} as Params));
    expectTypeOf<Toolset["bindLocale"]>().toExtend<(params: Promise<Params>) => Promise<Params>>();
  });

  // -----------------------------------------------------------------------
  // type discrimination
  // -----------------------------------------------------------------------

  it("different atlas types produce different toolset types", () => {
    type OtherAtlas = { readonly other: { readonly value: number } };
    expectTypeOf<NextAppServerToolset<TestAtlas, TestPathAtlas, "locale">>().not.toEqualTypeOf<
      NextAppServerToolset<OtherAtlas, TestPathAtlas, "locale">
    >();
  });

  it("different path atlas types produce different path composers", () => {
    type OtherPathAtlas = { readonly decl: { readonly "/contact": {} } };
    type PathAtlasFromToolset = Toolset["getPathComposer"] extends () => Promise<BoundPathComposer<infer PA>>
      ? PA
      : never;
    type OtherPathAtlasFromToolset = NextAppServerToolset<
      TestAtlas,
      OtherPathAtlas,
      "locale"
    >["getPathComposer"] extends () => Promise<BoundPathComposer<infer PA>>
      ? PA
      : never;
    expectTypeOf<PathAtlasFromToolset>().not.toEqualTypeOf<OtherPathAtlasFromToolset>();
  });

  it("different locale key types produce different toolset types", () => {
    expectTypeOf<NextAppServerToolset<TestAtlas, TestPathAtlas, "locale">>().not.toEqualTypeOf<
      NextAppServerToolset<TestAtlas, TestPathAtlas, "lang">
    >();
  });
});

// ---------------------------------------------------------------------------
// NextAppServerRMachine
// ---------------------------------------------------------------------------

describe("NextAppServerRMachine", () => {
  it("is callable with children prop", () => {
    expectTypeOf<NextAppServerRMachine>().toBeCallableWith({
      children: null as unknown as ReactNode,
    });
  });

  it("returns Promise<ReactNode>", () => {
    expectTypeOf<NextAppServerRMachine>().returns.toEqualTypeOf<Promise<ReactNode>>();
  });
});

// ---------------------------------------------------------------------------
// NextAppServerImpl
// ---------------------------------------------------------------------------

describe("NextAppServerImpl", () => {
  it("has exactly the expected properties", () => {
    expectTypeOf<NextAppServerImpl>().toHaveProperty("localeKey");
    expectTypeOf<NextAppServerImpl>().toHaveProperty("autoLocaleBinding");
    expectTypeOf<NextAppServerImpl>().toHaveProperty("writeLocale");
    expectTypeOf<NextAppServerImpl>().toHaveProperty("createLocaleStaticParamsGenerator");
    expectTypeOf<NextAppServerImpl>().toHaveProperty("createProxy");
    expectTypeOf<NextAppServerImpl>().toHaveProperty("createBoundPathComposerSupplier");

    type Keys = keyof NextAppServerImpl;
    expectTypeOf<Keys>().toEqualTypeOf<
      | "localeKey"
      | "autoLocaleBinding"
      | "writeLocale"
      | "createLocaleStaticParamsGenerator"
      | "createProxy"
      | "createBoundPathComposerSupplier"
    >();
  });

  it("localeKey is string", () => {
    expectTypeOf<NextAppServerImpl["localeKey"]>().toBeString();
  });

  it("autoLocaleBinding is boolean", () => {
    expectTypeOf<NextAppServerImpl["autoLocaleBinding"]>().toBeBoolean();
  });

  it("writeLocale accepts locale, newLocale, cookies, and headers", () => {
    expectTypeOf<NextAppServerImpl["writeLocale"]>().parameter(0).toEqualTypeOf<string | undefined>();
    expectTypeOf<NextAppServerImpl["writeLocale"]>().parameter(1).toBeString();
    expectTypeOf<NextAppServerImpl["writeLocale"]>().parameter(2).toEqualTypeOf<CookiesFn>();
    expectTypeOf<NextAppServerImpl["writeLocale"]>().parameter(3).toEqualTypeOf<HeadersFn>();
  });

  it("writeLocale returns void or Promise<void>", () => {
    expectTypeOf<NextAppServerImpl["writeLocale"]>().returns.toEqualTypeOf<void | Promise<void>>();
  });

  it("createLocaleStaticParamsGenerator returns a generator or Promise of generator", () => {
    type Generator = () => Promise<{ [key: string]: string }[]>;
    expectTypeOf<NextAppServerImpl["createLocaleStaticParamsGenerator"]>().returns.toExtend<
      Generator | Promise<Generator>
    >();
  });

  it("createProxy returns RMachineProxy or Promise<RMachineProxy>", () => {
    expectTypeOf<NextAppServerImpl["createProxy"]>().returns.toEqualTypeOf<RMachineProxy | Promise<RMachineProxy>>();
  });

  it("createBoundPathComposerSupplier accepts a getLocale function", () => {
    expectTypeOf<NextAppServerImpl["createBoundPathComposerSupplier"]>()
      .parameter(0)
      .toEqualTypeOf<() => Promise<string>>();
  });

  it("createBoundPathComposerSupplier returns a supplier or its Promise", () => {
    type Supplier = () => Promise<BoundPathComposer<AnyPathAtlas>>;
    expectTypeOf<NextAppServerImpl["createBoundPathComposerSupplier"]>().returns.toEqualTypeOf<
      Supplier | Promise<Supplier>
    >();
  });
});
