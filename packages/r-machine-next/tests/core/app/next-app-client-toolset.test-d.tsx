import type { RMachine } from "r-machine";
import type { AnyResAtlas, ExperimentalFlags, ResEquipment } from "r-machine/core";
import type { ReactNode } from "react";
import { describe, expectTypeOf, it } from "vitest";
import type { AnyPathAtlas, BoundPathComposer, NextClientPlugDefiner } from "#r-machine/next/core";
import type {
  NextAppClientImpl,
  NextAppClientRMachine,
  NextAppClientToolset,
} from "../../../src/core/app/next-app-client-toolset.js";
import { createNextAppClientToolset } from "../../../src/core/app/next-app-client-toolset.js";
import type { TestLocale, TranslatedPathAtlas } from "../../_fixtures/constants.js";
import type { TestAtlas } from "../../_fixtures/mock-machine.js";

type E = ResEquipment<TestAtlas>;
type NoFlags = ExperimentalFlags;
type KM = {};

// ---------------------------------------------------------------------------
// createNextAppClientToolset
// ---------------------------------------------------------------------------

describe("createNextAppClientToolset", () => {
  it("accepts (RMachine, clientKit, NextAppClientImpl) and returns a Promise of NextAppClientToolset", () => {
    const fn = createNextAppClientToolset<TestAtlas, TestLocale, E, NoFlags, KM, TranslatedPathAtlas>;
    expectTypeOf(fn).parameter(0).toEqualTypeOf<RMachine<TestAtlas, TestLocale, E, NoFlags>>();
    expectTypeOf(fn).parameter(1).toEqualTypeOf<KM>();
    expectTypeOf(fn).parameter(2).toEqualTypeOf<NextAppClientImpl<TestLocale>>();
  });

  it("returns a Promise of NextAppClientToolset", () => {
    expectTypeOf(
      createNextAppClientToolset<TestAtlas, TestLocale, E, NoFlags, KM, TranslatedPathAtlas>
    ).returns.toEqualTypeOf<Promise<NextAppClientToolset<TestAtlas, TestLocale, NoFlags, KM, TranslatedPathAtlas>>>();
  });
});

// ---------------------------------------------------------------------------
// NextAppClientToolset
// ---------------------------------------------------------------------------

describe("NextAppClientToolset", () => {
  type Toolset = NextAppClientToolset<TestAtlas, TestLocale, NoFlags, KM, TranslatedPathAtlas>;

  it("has NextClientRMachine and ClientPlug properties", () => {
    expectTypeOf<Toolset["NextClientRMachine"]>().toEqualTypeOf<NextAppClientRMachine<TestLocale>>();
    expectTypeOf<Toolset["ClientPlug"]>().toEqualTypeOf<
      NextClientPlugDefiner<TestAtlas, TestLocale, KM, TranslatedPathAtlas>
    >();
  });

  it("does not carry legacy hook surface (useLocale, useSetLocale, useR, useRKit, usePathComposer)", () => {
    expectTypeOf<Toolset>().not.toHaveProperty("useLocale");
    expectTypeOf<Toolset>().not.toHaveProperty("useSetLocale");
    expectTypeOf<Toolset>().not.toHaveProperty("useR");
    expectTypeOf<Toolset>().not.toHaveProperty("useRKit");
    expectTypeOf<Toolset>().not.toHaveProperty("usePathComposer");
  });

  it("does not expose ReactRMachine directly", () => {
    expectTypeOf<Toolset>().not.toHaveProperty("ReactRMachine");
  });

  it("NextClientRMachine locale parameter tracks the toolset's L parameter", () => {
    type ToolsetEnIt = NextAppClientToolset<TestAtlas, "en" | "it", NoFlags, KM, TranslatedPathAtlas>;
    type ToolsetFrDe = NextAppClientToolset<TestAtlas, "fr" | "de", NoFlags, KM, TranslatedPathAtlas>;
    expectTypeOf<ToolsetEnIt["NextClientRMachine"]>().toEqualTypeOf<NextAppClientRMachine<"en" | "it">>();
    expectTypeOf<ToolsetEnIt["NextClientRMachine"]>().not.toEqualTypeOf<ToolsetFrDe["NextClientRMachine"]>();
  });

  it("different RA produce different toolset types", () => {
    interface OtherAtlas extends AnyResAtlas {
      readonly other: { readonly value: number };
    }
    expectTypeOf<NextAppClientToolset<TestAtlas, TestLocale, NoFlags, KM, TranslatedPathAtlas>>().not.toEqualTypeOf<
      NextAppClientToolset<OtherAtlas, TestLocale, NoFlags, KM, TranslatedPathAtlas>
    >();
  });

  it("different L produce different toolset types", () => {
    type OtherLocale = "fr" | "de";
    expectTypeOf<NextAppClientToolset<TestAtlas, TestLocale, NoFlags, KM, TranslatedPathAtlas>>().not.toEqualTypeOf<
      NextAppClientToolset<TestAtlas, OtherLocale, NoFlags, KM, TranslatedPathAtlas>
    >();
  });

  it("carries PA as an erased phantom param (path composers type-erase to AnyPathAtlas)", () => {
    // The public toolset surface exposes path composition only through
    // `$.getPath`, typed as BoundPathComposer<AnyPathAtlas>. PA is therefore
    // carried for documentation but does not structurally differentiate the
    // toolset type — two different PAs produce the same NextAppClientToolset.
    type OtherPathAtlas = { readonly segment: { readonly "/contact": {} } };
    expectTypeOf<NextAppClientToolset<TestAtlas, TestLocale, NoFlags, KM, TranslatedPathAtlas>>().toEqualTypeOf<
      NextAppClientToolset<TestAtlas, TestLocale, NoFlags, KM, OtherPathAtlas>
    >();
  });
});

// ---------------------------------------------------------------------------
// NextAppClientRMachine
// ---------------------------------------------------------------------------

describe("NextAppClientRMachine", () => {
  it("is callable with locale and children", () => {
    expectTypeOf<NextAppClientRMachine<TestLocale>>().toBeCallableWith({
      locale: "en",
      children: null as unknown as ReactNode,
    });
  });

  it("rejects locale values not in L", () => {
    const Component = {} as NextAppClientRMachine<TestLocale>;
    // @ts-expect-error - "fr" is not in TestLocale ("en" | "it")
    Component({ locale: "fr", children: null as unknown as ReactNode });
  });

  it("accepts an optional scopeId string", () => {
    expectTypeOf<NextAppClientRMachine<TestLocale>>().toBeCallableWith({
      locale: "en",
      scopeId: "some-id",
      children: null as unknown as ReactNode,
    });
  });

  it("returns ReactNode", () => {
    expectTypeOf<NextAppClientRMachine<TestLocale>>().returns.toExtend<ReactNode>();
  });
});

// ---------------------------------------------------------------------------
// NextAppClientImpl
// ---------------------------------------------------------------------------

describe("NextAppClientImpl", () => {
  it("has exactly the expected properties (onLoad, writeLocale, createPathComposer)", () => {
    type Keys = keyof NextAppClientImpl<TestLocale>;
    expectTypeOf<Keys>().toEqualTypeOf<"onLoad" | "writeLocale" | "createPathComposer">();
  });

  it("does not have createUsePathComposer", () => {
    expectTypeOf<NextAppClientImpl<TestLocale>>().not.toHaveProperty("createUsePathComposer");
  });

  it("onLoad can be undefined", () => {
    expectTypeOf<undefined>().toExtend<NextAppClientImpl<TestLocale>["onLoad"]>();
  });

  it("onLoad can be a function returning void", () => {
    expectTypeOf<(locale: TestLocale) => void>().toExtend<NonNullable<NextAppClientImpl<TestLocale>["onLoad"]>>();
  });

  it("onLoad can be a function returning a cleanup function", () => {
    expectTypeOf<(locale: TestLocale) => () => void>().toExtend<NonNullable<NextAppClientImpl<TestLocale>["onLoad"]>>();
  });

  it("writeLocale accepts locale as first parameter", () => {
    expectTypeOf<NextAppClientImpl<TestLocale>["writeLocale"]>().parameter(0).toEqualTypeOf<TestLocale>();
  });

  it("writeLocale accepts newLocale as second parameter", () => {
    expectTypeOf<NextAppClientImpl<TestLocale>["writeLocale"]>().parameter(1).toEqualTypeOf<TestLocale>();
  });

  it("writeLocale accepts pathname as third parameter", () => {
    expectTypeOf<NextAppClientImpl<TestLocale>["writeLocale"]>().parameter(2).toBeString();
  });

  it("writeLocale returns void or Promise<void>", () => {
    expectTypeOf<NextAppClientImpl<TestLocale>["writeLocale"]>().returns.toEqualTypeOf<void | Promise<void>>();
  });

  it("createPathComposer accepts a locale and returns a BoundPathComposer", () => {
    expectTypeOf<NextAppClientImpl<TestLocale>["createPathComposer"]>().parameter(0).toEqualTypeOf<TestLocale>();
    expectTypeOf<NextAppClientImpl<TestLocale>["createPathComposer"]>().returns.toEqualTypeOf<
      BoundPathComposer<AnyPathAtlas>
    >();
  });
});
