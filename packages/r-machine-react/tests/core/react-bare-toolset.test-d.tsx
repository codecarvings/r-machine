import type { RMachine } from "r-machine";
import type { ExperimentalFlags, ResEquipment } from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import type { ReactNode } from "react";
import { describe, expectTypeOf, it } from "vitest";
import {
  createReactBareToolset,
  type ReactBareRMachine,
  type ReactBareToolset,
} from "../../src/core/react-bare-toolset.js";
import type { ReactPlugDefiner } from "../../src/core/react-plug.js";
import type { TestAtlas } from "../_fixtures/mock-machine.js";

type E = ResEquipment<TestAtlas>;
type NoFlags = ExperimentalFlags; // outerGear not "on"
type OuterOn = { readonly outerGear: "on" };
type KM = {};

// ---------------------------------------------------------------------------
// createReactBareToolset
// ---------------------------------------------------------------------------

describe("createReactBareToolset", () => {
  it("accepts (RMachine, kit) and returns a Promise of ReactBareToolset", () => {
    const fn = createReactBareToolset<TestAtlas, AnyLocale, E, NoFlags, KM>;
    expectTypeOf(fn).parameter(0).toEqualTypeOf<RMachine<TestAtlas, AnyLocale, E, NoFlags>>();
    expectTypeOf(fn).parameter(1).toEqualTypeOf<KM>();
    expectTypeOf(fn).returns.toEqualTypeOf<Promise<ReactBareToolset<TestAtlas, AnyLocale, NoFlags, KM>>>();
  });
});

// ---------------------------------------------------------------------------
// ReactBareToolset — current shape: { ReactRMachine, Plug } (+ VertexFrame)
// ---------------------------------------------------------------------------

describe("ReactBareToolset", () => {
  type Toolset = ReactBareToolset<TestAtlas, AnyLocale, NoFlags, KM>;

  it("exposes ReactRMachine and Plug", () => {
    expectTypeOf<Toolset["ReactRMachine"]>().toEqualTypeOf<ReactBareRMachine<AnyLocale>>();
    expectTypeOf<Toolset["Plug"]>().toEqualTypeOf<ReactPlugDefiner<TestAtlas, AnyLocale, KM>>();
  });

  it("has exactly { ReactRMachine, Plug } when outerGear is off", () => {
    expectTypeOf<keyof Toolset>().toEqualTypeOf<"ReactRMachine" | "Plug">();
  });

  it("adds VertexFrame when experimental.outerGear is 'on'", () => {
    type OuterToolset = ReactBareToolset<TestAtlas, AnyLocale, OuterOn, KM>;
    expectTypeOf<keyof OuterToolset>().toEqualTypeOf<"ReactRMachine" | "Plug" | "VertexFrame">();
  });

  it("no longer carries the legacy hook surface", () => {
    expectTypeOf<Toolset>().not.toHaveProperty("useLocale");
    expectTypeOf<Toolset>().not.toHaveProperty("useSetLocale");
    expectTypeOf<Toolset>().not.toHaveProperty("useR");
    expectTypeOf<Toolset>().not.toHaveProperty("useRKit");
  });
});

// ---------------------------------------------------------------------------
// ReactBareRMachine
// ---------------------------------------------------------------------------

describe("ReactBareRMachine", () => {
  it("is callable with locale, children, and optional writeLocale (sync/async/undefined)", () => {
    const children = null as unknown as ReactNode;
    expectTypeOf<ReactBareRMachine<AnyLocale>>().toBeCallableWith({ locale: "en", children });
    expectTypeOf<ReactBareRMachine<AnyLocale>>().toBeCallableWith({ locale: "en", writeLocale: () => {}, children });
    expectTypeOf<ReactBareRMachine<AnyLocale>>().toBeCallableWith({
      locale: "en",
      writeLocale: async () => {},
      children,
    });
    expectTypeOf<ReactBareRMachine<AnyLocale>>().toBeCallableWith({ locale: "en", writeLocale: undefined, children });
  });

  it("returns ReactNode", () => {
    expectTypeOf<ReactBareRMachine<AnyLocale>>().returns.toExtend<ReactNode>();
  });

  it("probe accepts string | undefined and returns L | undefined", () => {
    expectTypeOf<ReactBareRMachine<AnyLocale>["probe"]>().toBeCallableWith("en");
    expectTypeOf<ReactBareRMachine<AnyLocale>["probe"]>().toBeCallableWith(undefined);
    expectTypeOf<ReactBareRMachine<AnyLocale>["probe"]>().returns.toEqualTypeOf<string | undefined>();
  });
});

// ---------------------------------------------------------------------------
// Narrowed Locale type
// ---------------------------------------------------------------------------

describe("narrowed Locale type", () => {
  type AppLocale = "en" | "it";

  it("ReactRMachine locale prop is typed as the narrowed locale", () => {
    expectTypeOf<ReactBareRMachine<AppLocale>>().toBeCallableWith({
      locale: "en" as AppLocale,
      children: null as unknown as ReactNode,
    });
  });

  it("probe returns the narrowed locale or undefined", () => {
    expectTypeOf<ReactBareRMachine<AppLocale>["probe"]>().returns.toEqualTypeOf<AppLocale | undefined>();
  });

  it("a differently-narrowed toolset is not assignable", () => {
    type OtherLocale = "fr" | "de";
    expectTypeOf<ReactBareToolset<TestAtlas, AppLocale, NoFlags, KM>>().not.toEqualTypeOf<
      ReactBareToolset<TestAtlas, OtherLocale, NoFlags, KM>
    >();
  });
});
