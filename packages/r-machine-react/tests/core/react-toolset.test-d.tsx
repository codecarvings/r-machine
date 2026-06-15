import type { RMachine } from "r-machine";
import type { ExperimentalFlags, ResEquipment } from "r-machine/core";
import type { AnyLocale } from "r-machine/locale";
import type { ReactNode } from "react";
import { describe, expectTypeOf, it } from "vitest";
import type { SuspenseComponent } from "#r-machine/react/utils";
import type { ReactPlugDefiner } from "../../src/core/react-plug.js";
import {
  createReactToolset,
  type ReactImpl,
  type ReactRMachine,
  type ReactToolset,
} from "../../src/core/react-toolset.js";
import type { TestAtlas } from "../_fixtures/mock-machine.js";

type E = ResEquipment<TestAtlas>;
type NoFlags = ExperimentalFlags;
type KM = {};

// ---------------------------------------------------------------------------
// createReactToolset
// ---------------------------------------------------------------------------

describe("createReactToolset", () => {
  it("accepts (RMachine, kit, ReactImpl) and returns a Promise of ReactToolset", () => {
    const fn = createReactToolset<TestAtlas, AnyLocale, E, NoFlags, KM>;
    expectTypeOf(fn).parameter(0).toEqualTypeOf<RMachine<TestAtlas, AnyLocale, E, NoFlags>>();
    expectTypeOf(fn).parameter(1).toEqualTypeOf<KM>();
    expectTypeOf(fn).parameter(2).toEqualTypeOf<ReactImpl<AnyLocale>>();
    expectTypeOf(fn).returns.toEqualTypeOf<Promise<ReactToolset<TestAtlas, AnyLocale, NoFlags, KM>>>();
  });
});

// ---------------------------------------------------------------------------
// ReactToolset — { ReactRMachine (enhanced), Plug } (+ VertexFrame)
// ---------------------------------------------------------------------------

describe("ReactToolset", () => {
  type Toolset = ReactToolset<TestAtlas, AnyLocale, NoFlags, KM>;

  it("ReactRMachine is the enhanced variant (differs from the bare provider)", () => {
    expectTypeOf<Toolset["ReactRMachine"]>().toEqualTypeOf<ReactRMachine>();
  });

  it("carries the same Plug as the bare toolset", () => {
    expectTypeOf<Toolset["Plug"]>().toEqualTypeOf<ReactPlugDefiner<TestAtlas, AnyLocale, KM>>();
  });

  it("has exactly { ReactRMachine, Plug } when outerGear is off", () => {
    expectTypeOf<keyof Toolset>().toEqualTypeOf<"ReactRMachine" | "Plug">();
  });
});

// ---------------------------------------------------------------------------
// ReactRMachine (enhanced)
// ---------------------------------------------------------------------------

describe("ReactRMachine", () => {
  const children = null as unknown as ReactNode;

  it("is callable with children only, and with fallback / Suspense props", () => {
    expectTypeOf<ReactRMachine>().toBeCallableWith({ children });
    expectTypeOf<ReactRMachine>().toBeCallableWith({ fallback: children, children });
    expectTypeOf<ReactRMachine>().toBeCallableWith({ Suspense: null as unknown as SuspenseComponent, children });
    expectTypeOf<ReactRMachine>().toBeCallableWith({ Suspense: null, children });
    expectTypeOf<ReactRMachine>().toBeCallableWith({ Suspense: undefined, children });
  });

  it("returns ReactNode and has no probe (unlike the bare provider)", () => {
    expectTypeOf<ReactRMachine>().returns.toExtend<ReactNode>();
    expectTypeOf<ReactRMachine>().not.toHaveProperty("probe");
  });
});

// ---------------------------------------------------------------------------
// ReactImpl
// ---------------------------------------------------------------------------

describe("ReactImpl", () => {
  it("readLocale takes no params and returns L | Promise<L>", () => {
    expectTypeOf<ReactImpl<AnyLocale>["readLocale"]>().parameters.toEqualTypeOf<[]>();
    expectTypeOf<ReactImpl<AnyLocale>["readLocale"]>().returns.toEqualTypeOf<string | Promise<string>>();
  });

  it("writeLocale takes an L param and returns void | Promise<void>", () => {
    expectTypeOf<ReactImpl<AnyLocale>["writeLocale"]>().parameter(0).toEqualTypeOf<string>();
    expectTypeOf<ReactImpl<AnyLocale>["writeLocale"]>().returns.toEqualTypeOf<void | Promise<void>>();
  });
});

// ---------------------------------------------------------------------------
// Narrowed Locale type
// ---------------------------------------------------------------------------

describe("narrowed Locale type", () => {
  type AppLocale = "en" | "it";

  it("ReactImpl with a narrowed locale constrains readLocale / writeLocale", () => {
    expectTypeOf<ReactImpl<AppLocale>["readLocale"]>().returns.toEqualTypeOf<AppLocale | Promise<AppLocale>>();
    expectTypeOf<ReactImpl<AppLocale>["writeLocale"]>().parameter(0).toEqualTypeOf<AppLocale>();
  });

  it("writeLocale rejects locale values not in L", () => {
    const impl = {} as ReactImpl<AppLocale>;
    // @ts-expect-error - "fr" is not in AppLocale ("en" | "it")
    impl.writeLocale("fr");
  });
});
