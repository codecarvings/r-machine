import { describe, expectTypeOf, it } from "vitest";
import type { EmptyFmtProvider, FmtProvider } from "../../src/lib/fmt.js";
import { FormattersSeed } from "../../src/lib/formatters-seed.js";
import { RMachine } from "../../src/lib/r-machine.js";
import type { RMachineBuilder, RMachineExtendedBuilder, RMachineExtensions } from "../../src/lib/r-machine-builder.js";

type TestAtlas = { readonly common: { greeting: string } };

describe("RMachineBuilder", () => {
  it("should have .with method", () => {
    expectTypeOf<RMachineBuilder<"en" | "it">>().toHaveProperty("with").toBeFunction();
  });

  it("should have .create method", () => {
    expectTypeOf<RMachineBuilder<"en" | "it">>().toHaveProperty("create").toBeFunction();
  });

  it("create should return an RMachine with EmptyFmtProvider", () => {
    const builder = RMachine.builder({
      locales: ["en", "it"] as const,
      defaultLocale: "en" as const,
      rModuleResolver: async () => ({ default: {} }),
    });
    const machine = builder.create<TestAtlas>();
    expectTypeOf(machine).toEqualTypeOf<RMachine<TestAtlas, "en" | "it", EmptyFmtProvider>>();
  });
});

describe("RMachineExtendedBuilder", () => {
  it("should have .create method", () => {
    expectTypeOf<RMachineExtendedBuilder<"en", EmptyFmtProvider>>().toHaveProperty("create").toBeFunction();
  });

  it("should not have .with method", () => {
    expectTypeOf<RMachineExtendedBuilder<"en", EmptyFmtProvider>>().not.toHaveProperty("with");
  });

  it("should not allow calling .with() a second time", () => {
    const Formatters = FormattersSeed.create((_locale: "en" | "it") => ({ v: 1 }));
    const extended = RMachine.builder({
      locales: ["en", "it"] as const,
      defaultLocale: "en" as const,
      rModuleResolver: async () => ({ default: {} }),
    }).with({ Formatters });

    // @ts-expect-error - .with() is not available on RMachineExtendedBuilder
    extended.with;
  });

  it("create should return an RMachine with fmt", () => {
    const Formatters = FormattersSeed.create((_locale: "en" | "it") => ({ v: 1 }));
    const extended = RMachine.builder({
      locales: ["en", "it"] as const,
      defaultLocale: "en" as const,
      rModuleResolver: async () => ({ default: {} }),
    }).with({ Formatters });
    const machine = extended.create<TestAtlas>();
    expectTypeOf(machine).toBeObject();
    expectTypeOf(machine.fmt).toBeFunction();
    expectTypeOf(machine.fmt("en")).toHaveProperty("v");
  });
});

describe("RMachineExtensions", () => {
  it("should have Formatters property", () => {
    expectTypeOf<RMachineExtensions<EmptyFmtProvider>>().toHaveProperty("Formatters");
  });

  it("should accept FmtProviderCtor as Formatters", () => {
    type FP = FmtProvider<string, { n: number }>;
    expectTypeOf<RMachineExtensions<FP>>().toHaveProperty("Formatters");
  });
});

describe("builder flow type inference", () => {
  it("with() narrows the formatter type through to create()", () => {
    const Formatters = FormattersSeed.create((_locale: "en" | "it") => ({
      currency: (n: number) => `$${n}`,
    }));

    const machine = RMachine.builder({
      locales: ["en", "it"] as const,
      defaultLocale: "en" as const,
      rModuleResolver: async () => ({ default: {} }),
    })
      .with({ Formatters })
      .create<TestAtlas>();

    expectTypeOf(machine).toBeObject();
    expectTypeOf(machine.fmt).toBeFunction();
    expectTypeOf(machine.fmt("en")).toHaveProperty("currency");
  });

  it("create() without with() produces valid RMachine with EmptyFmtProvider", () => {
    const machine = RMachine.builder({
      locales: ["en"] as const,
      defaultLocale: "en" as const,
      rModuleResolver: async () => ({ default: {} }),
    }).create<TestAtlas>();

    expectTypeOf(machine).toEqualTypeOf<RMachine<TestAtlas, "en", EmptyFmtProvider>>();
  });

  it("ResourceAtlas generic flows through both builder paths", () => {
    type WideAtlas = {
      readonly common: { greeting: string };
      readonly home: { title: string };
    };

    const config = {
      locales: ["en"] as const,
      defaultLocale: "en" as const,
      rModuleResolver: async () => ({ default: {} }),
    };

    const direct = RMachine.builder(config).create<WideAtlas>();
    expectTypeOf(direct.pickR("en", "home")).toEqualTypeOf<Promise<{ title: string }>>();

    const Formatters = FormattersSeed.create((_locale: "en") => ({ v: 1 }));
    const withFormatters = RMachine.builder(config).with({ Formatters }).create<WideAtlas>();
    expectTypeOf(withFormatters.pickR("en", "home")).toEqualTypeOf<Promise<{ title: string }>>();
  });
});
