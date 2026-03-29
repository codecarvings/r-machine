import { describe, expectTypeOf, it } from "vitest";
import type { EmptyFmtProvider } from "../../src/lib/fmt.js";
import { FormattersSeed } from "../../src/lib/formatters-seed.js";
import type { RKit } from "../../src/lib/r-kit.js";
import { RMachine, type RMachineLocale, type RMachineRCtx } from "../../src/lib/r-machine.js";
import { defaultRMachineExtensions } from "../../src/lib/r-machine-builder.js";
import type { RMachineConfig } from "../../src/lib/r-machine-config.js";
import type { RCtx } from "../../src/lib/r-module.js";
import type { AnyResourceAtlas, Namespace } from "../../src/lib/resource-atlas.js";
import type { LocaleHelper } from "../../src/locale/locale-helper.js";
import { TestableRMachine } from "../_fixtures/testable-r-machine.js";

type TestResourceAtlas = {
  readonly common: { greeting: string; farewell: string };
  readonly home: { title: string; description: string };
  readonly about: { heading: string };
};

type FactoryResourceAtlas = {
  readonly common: ($: RCtx) => { greeting: string };
  readonly dynamic: ($: RCtx) => Promise<{ value: number }>;
};

type MixedResourceAtlas = {
  readonly static: { message: string };
  readonly factory: ($: RCtx) => { result: boolean };
  readonly asyncFactory: ($: RCtx) => Promise<{ data: string[] }>;
};

type SingleNamespaceAtlas = {
  readonly only: { single: string };
};

const mockConfig: RMachineConfig<AnyResourceAtlas, string> = {
  locales: ["en", "it"],
  defaultLocale: "en",
  rModuleResolver: async () => ({ default: {} }),
};

const narrowConfig: RMachineConfig<AnyResourceAtlas, "en" | "it"> = {
  locales: ["en", "it"],
  defaultLocale: "en",
  rModuleResolver: async () => ({ default: {} }),
};

function createMachine<RA extends AnyResourceAtlas>() {
  return new RMachine<RA, string, EmptyFmtProvider>(mockConfig as any, defaultRMachineExtensions);
}

function createNarrowMachine<RA extends AnyResourceAtlas>() {
  return new RMachine<RA, "en" | "it", EmptyFmtProvider>(narrowConfig as any, defaultRMachineExtensions);
}

describe("RMachine", () => {
  describe("static factory methods", () => {
    it("should produce an RMachine instance via constructor", () => {
      const machine = new RMachine(mockConfig, defaultRMachineExtensions);
      expectTypeOf(machine).toBeObject();
    });

    it("should preserve narrow locale types", () => {
      const machine = createNarrowMachine<TestResourceAtlas>();
      expectTypeOf(machine).toEqualTypeOf<RMachine<TestResourceAtlas, "en" | "it", EmptyFmtProvider>>();
    });

    it("should produce string locale when config uses string", () => {
      const machine = createMachine<TestResourceAtlas>();
      expectTypeOf(machine).toEqualTypeOf<RMachine<TestResourceAtlas, string, EmptyFmtProvider>>();
    });

    it("constructor with custom Formatters should produce a typed RMachine", () => {
      const Formatters = FormattersSeed.create((_locale: "en" | "it") => ({ date: (d: Date) => d.toISOString() }));
      type FPC = typeof Formatters;
      const machine = new RMachine<TestResourceAtlas, "en" | "it", InstanceType<FPC>>(narrowConfig as any, {
        Formatters,
      });
      expectTypeOf(machine).toBeObject();
    });

    it("constructor without custom Formatters produces EmptyFmtProvider", () => {
      const machine = createNarrowMachine<TestResourceAtlas>();
      expectTypeOf(machine).toEqualTypeOf<RMachine<TestResourceAtlas, "en" | "it", EmptyFmtProvider>>();
    });
  });

  describe("class definition", () => {
    it("should reject RA types that do not extend AnyResourceAtlas", () => {
      // @ts-expect-error - number does not extend AnyResourceAtlas
      type _Invalid = RMachine<number, string, EmptyFmtProvider>;
    });
  });

  describe("instance properties", () => {
    it("should have readonly locales property", () => {
      const machine = createMachine<TestResourceAtlas>();
      expectTypeOf(machine).toHaveProperty("locales");
      expectTypeOf(machine.locales).toEqualTypeOf<readonly string[]>();

      // @ts-expect-error - locales is readonly
      machine.locales = ["en"];
    });

    it("should have readonly defaultLocale property", () => {
      const machine = createMachine<TestResourceAtlas>();
      expectTypeOf(machine).toHaveProperty("defaultLocale");
      expectTypeOf(machine.defaultLocale).toEqualTypeOf<string>();

      // @ts-expect-error - defaultLocale is readonly
      machine.defaultLocale = "en";
    });

    it("should not expose config publicly", () => {
      const machine = createMachine<TestResourceAtlas>();
      // @ts-expect-error - config is protected
      machine.config;
    });

    it("should have readonly localeHelper property", () => {
      const machine = createMachine<TestResourceAtlas>();
      expectTypeOf(machine).toHaveProperty("localeHelper");
      expectTypeOf(machine.localeHelper).toEqualTypeOf<LocaleHelper<string>>();

      // @ts-expect-error - localeHelper is readonly
      machine.localeHelper = {} as LocaleHelper<string>;
    });

    it("localeHelper should preserve narrow locale type", () => {
      const machine = createNarrowMachine<TestResourceAtlas>();
      expectTypeOf(machine.localeHelper).toEqualTypeOf<LocaleHelper<"en" | "it">>();
    });

    it("locales and defaultLocale should preserve narrow locale type", () => {
      const machine = createNarrowMachine<TestResourceAtlas>();
      expectTypeOf(machine.locales).toEqualTypeOf<readonly ("en" | "it")[]>();
      expectTypeOf(machine.defaultLocale).toEqualTypeOf<"en" | "it">();
    });
  });

  describe("pickR method", () => {
    it("should be a function property", () => {
      const machine = createMachine<TestResourceAtlas>();
      expectTypeOf(machine.pickR).toBeFunction();
    });

    it("should accept locale as first parameter", () => {
      const machine = createMachine<TestResourceAtlas>();
      expectTypeOf(machine.pickR).parameter(0).toEqualTypeOf<string>();
    });

    it("should accept namespace as second parameter", () => {
      const machine = createMachine<TestResourceAtlas>();
      expectTypeOf(machine.pickR).parameter(1).toEqualTypeOf<Namespace<TestResourceAtlas>>();
    });

    it("should return Promise of the resource type for the namespace", async () => {
      const machine = createMachine<TestResourceAtlas>();
      const result = machine.pickR("en", "common");
      expectTypeOf(result).toEqualTypeOf<Promise<TestResourceAtlas["common"]>>();
    });

    it("should return correct type for different namespaces", async () => {
      const machine = createMachine<TestResourceAtlas>();

      const common = machine.pickR("en", "common");
      expectTypeOf(common).toEqualTypeOf<Promise<{ greeting: string; farewell: string }>>();

      const home = machine.pickR("en", "home");
      expectTypeOf(home).toEqualTypeOf<Promise<{ title: string; description: string }>>();

      const about = machine.pickR("en", "about");
      expectTypeOf(about).toEqualTypeOf<Promise<{ heading: string }>>();
    });

    it("should infer namespace type from literal argument", () => {
      const machine = createMachine<TestResourceAtlas>();
      const result = machine.pickR("en", "common");
      expectTypeOf(result).toEqualTypeOf<Promise<TestResourceAtlas["common"]>>();
    });

    // Note: pickR's return type is Promise<RA[N]>, i.e. the atlas entry as declared.
    // When the atlas maps a namespace to a factory (function), the type reflects the
    // factory signature — NOT the resolved resource. Runtime resolution unwraps the
    // factory, but at the type level the atlas entry is preserved as-is.
    it("should work with factory-based resource atlas", () => {
      const machine = createMachine<FactoryResourceAtlas>();

      const common = machine.pickR("en", "common");
      expectTypeOf(common).toEqualTypeOf<Promise<($: RCtx) => { greeting: string }>>();

      const dynamic = machine.pickR("en", "dynamic");
      expectTypeOf(dynamic).toEqualTypeOf<Promise<($: RCtx) => Promise<{ value: number }>>>();
    });

    it("should work with mixed resource atlas", () => {
      const machine = createMachine<MixedResourceAtlas>();

      const staticR = machine.pickR("en", "static");
      expectTypeOf(staticR).toEqualTypeOf<Promise<{ message: string }>>();

      const factory = machine.pickR("en", "factory");
      expectTypeOf(factory).toEqualTypeOf<Promise<($: RCtx) => { result: boolean }>>();

      const asyncFactory = machine.pickR("en", "asyncFactory");
      expectTypeOf(asyncFactory).toEqualTypeOf<Promise<($: RCtx) => Promise<{ data: string[] }>>>();
    });

    it("should work with single namespace atlas", () => {
      const machine = createMachine<SingleNamespaceAtlas>();
      const result = machine.pickR("en", "only");
      expectTypeOf(result).toEqualTypeOf<Promise<{ single: string }>>();
    });

    it("should be bound correctly when destructured", () => {
      const machine = createMachine<TestResourceAtlas>();
      const { pickR } = machine;
      expectTypeOf(pickR).toBeFunction();
      expectTypeOf(pickR("en", "common")).toEqualTypeOf<Promise<TestResourceAtlas["common"]>>();
    });

    it("should constrain locale parameter to narrow type when inferred", () => {
      const machine = createNarrowMachine<TestResourceAtlas>();
      expectTypeOf(machine.pickR).parameter(0).toEqualTypeOf<"en" | "it">();
    });

    it("should reject locale not in the narrow union", () => {
      const machine = createNarrowMachine<TestResourceAtlas>();
      // @ts-expect-error - "fr" is not in "en" | "it"
      machine.pickR("fr", "common");
    });

    it("should reject namespace not in the resource atlas", () => {
      const machine = createNarrowMachine<TestResourceAtlas>();
      // @ts-expect-error - "invalid" is not a key of TestResourceAtlas
      machine.pickR("en", "invalid");
    });
  });

  describe("pickRKit method", () => {
    it("should be a function property", () => {
      const machine = createMachine<TestResourceAtlas>();
      expectTypeOf(machine.pickRKit).toBeFunction();
    });

    it("should accept locale as first parameter", () => {
      const machine = createMachine<TestResourceAtlas>();
      expectTypeOf(machine.pickRKit).parameter(0).toEqualTypeOf<string>();
    });

    it("should accept rest namespaces parameter", () => {
      const machine = createMachine<TestResourceAtlas>();
      type Params = Parameters<typeof machine.pickRKit>;
      expectTypeOf<Params[0]>().toEqualTypeOf<string>();
    });

    it("should return Promise of RKit type", () => {
      const machine = createMachine<TestResourceAtlas>();
      const result = machine.pickRKit("en", "common", "home");
      expectTypeOf(result).toEqualTypeOf<Promise<RKit<TestResourceAtlas, readonly ["common", "home"]>>>();
    });

    it("should return correct tuple type for single namespace", () => {
      const machine = createMachine<TestResourceAtlas>();
      const result = machine.pickRKit("en", "common");
      expectTypeOf(result).toEqualTypeOf<Promise<RKit<TestResourceAtlas, readonly ["common"]>>>();
    });

    it("should return correct tuple type for multiple namespaces", () => {
      const machine = createMachine<TestResourceAtlas>();
      const result = machine.pickRKit("en", "common", "home", "about");
      expectTypeOf(result).toEqualTypeOf<Promise<RKit<TestResourceAtlas, readonly ["common", "home", "about"]>>>();
    });

    it("should preserve namespace order in result type", async () => {
      const machine = createMachine<TestResourceAtlas>();

      const kit1 = machine.pickRKit("en", "common", "home");
      type Kit1Result = Awaited<typeof kit1>;
      expectTypeOf<Kit1Result[0]>().toEqualTypeOf<TestResourceAtlas["common"]>();
      expectTypeOf<Kit1Result[1]>().toEqualTypeOf<TestResourceAtlas["home"]>();

      const kit2 = machine.pickRKit("en", "home", "common");
      type Kit2Result = Awaited<typeof kit2>;
      expectTypeOf<Kit2Result[0]>().toEqualTypeOf<TestResourceAtlas["home"]>();
      expectTypeOf<Kit2Result[1]>().toEqualTypeOf<TestResourceAtlas["common"]>();
    });

    it("should work with factory-based resource atlas", () => {
      const machine = createMachine<FactoryResourceAtlas>();
      const result = machine.pickRKit("en", "common", "dynamic");
      expectTypeOf(result).toEqualTypeOf<Promise<RKit<FactoryResourceAtlas, readonly ["common", "dynamic"]>>>();
    });

    it("should work with mixed resource atlas", () => {
      const machine = createMachine<MixedResourceAtlas>();
      const result = machine.pickRKit("en", "static", "factory", "asyncFactory");
      expectTypeOf(result).toEqualTypeOf<
        Promise<RKit<MixedResourceAtlas, readonly ["static", "factory", "asyncFactory"]>>
      >();
    });

    it("should be bound correctly when destructured", () => {
      const machine = createMachine<TestResourceAtlas>();
      const { pickRKit } = machine;
      expectTypeOf(pickRKit).toBeFunction();
      expectTypeOf(pickRKit("en", "common", "home")).toEqualTypeOf<
        Promise<RKit<TestResourceAtlas, readonly ["common", "home"]>>
      >();
    });

    it("should allow duplicate namespaces in tuple", () => {
      const machine = createMachine<TestResourceAtlas>();
      const result = machine.pickRKit("en", "common", "common");
      expectTypeOf(result).toEqualTypeOf<Promise<RKit<TestResourceAtlas, readonly ["common", "common"]>>>();
    });

    it("should reject locale not in the narrow union", () => {
      const machine = createNarrowMachine<TestResourceAtlas>();
      // @ts-expect-error - "fr" is not in "en" | "it"
      machine.pickRKit("fr", "common");
    });

    it("should reject namespace not in the resource atlas", () => {
      const machine = createNarrowMachine<TestResourceAtlas>();
      // @ts-expect-error - "invalid" is not a key of TestResourceAtlas
      machine.pickRKit("en", "invalid");
    });
  });

  describe("type inference", () => {
    it("namespace parameter should be constrained to atlas keys", () => {
      type TestMachine = RMachine<TestResourceAtlas, string, EmptyFmtProvider>;
      type PickRNamespace = Parameters<TestMachine["pickR"]>[1];
      expectTypeOf<PickRNamespace>().toEqualTypeOf<"common" | "home" | "about">();
    });

    it("namespace parameter should work with single namespace atlas", () => {
      type SingleMachine = RMachine<SingleNamespaceAtlas, string, EmptyFmtProvider>;
      type PickRNamespace = Parameters<SingleMachine["pickR"]>[1];
      expectTypeOf<PickRNamespace>().toEqualTypeOf<"only">();
    });

    it("should preserve resource property types through pickR", async () => {
      const machine = createMachine<TestResourceAtlas>();
      const common = await machine.pickR("en", "common");
      expectTypeOf(common.greeting).toEqualTypeOf<string>();
      expectTypeOf(common.farewell).toEqualTypeOf<string>();
    });

    it("should preserve resource property types through pickRKit", async () => {
      const machine = createMachine<TestResourceAtlas>();
      const kit = await machine.pickRKit("en", "common", "home");
      expectTypeOf(kit[0].greeting).toEqualTypeOf<string>();
      expectTypeOf(kit[0].farewell).toEqualTypeOf<string>();
      expectTypeOf(kit[1].title).toEqualTypeOf<string>();
      expectTypeOf(kit[1].description).toEqualTypeOf<string>();
    });
  });

  describe("protected members accessibility", () => {
    it("hybridPickR should not be accessible on instance", () => {
      const machine = createMachine<TestResourceAtlas>();
      expectTypeOf(machine).not.toHaveProperty("hybridPickR");
    });

    it("hybridPickRKit should not be accessible on instance", () => {
      const machine = createMachine<TestResourceAtlas>();
      expectTypeOf(machine).not.toHaveProperty("hybridPickRKit");
    });

    it("domainManager should not be accessible on instance", () => {
      const machine = createMachine<TestResourceAtlas>();
      expectTypeOf(machine).not.toHaveProperty("domainManager");
    });

    it("validateLocaleForPick should not be accessible on instance", () => {
      const machine = createMachine<TestResourceAtlas>();
      expectTypeOf(machine).not.toHaveProperty("validateLocaleForPick");
    });
  });

  describe("subclass access to protected members", () => {
    it("hybridPickR should return union of sync and async types", () => {
      const machine = new TestableRMachine<TestResourceAtlas>(mockConfig as any, defaultRMachineExtensions);
      const result = machine.exposeHybridPickR("en", "common");
      expectTypeOf(result).toEqualTypeOf<TestResourceAtlas["common"] | Promise<TestResourceAtlas["common"]>>();
    });

    it("hybridPickRKit should return union of sync and async types", () => {
      const machine = new TestableRMachine<TestResourceAtlas>(mockConfig as any, defaultRMachineExtensions);
      const result = machine.exposeHybridPickRKit("en", "common", "home");
      type Expected =
        | RKit<TestResourceAtlas, readonly ["common", "home"]>
        | Promise<RKit<TestResourceAtlas, readonly ["common", "home"]>>;
      expectTypeOf(result).toEqualTypeOf<Expected>();
    });

    it("hybridPickR should preserve namespace type in return", () => {
      const machine = new TestableRMachine<TestResourceAtlas>(mockConfig as any, defaultRMachineExtensions);

      const common = machine.exposeHybridPickR("en", "common");
      expectTypeOf(common).toEqualTypeOf<TestResourceAtlas["common"] | Promise<TestResourceAtlas["common"]>>();

      const home = machine.exposeHybridPickR("en", "home");
      expectTypeOf(home).toEqualTypeOf<TestResourceAtlas["home"] | Promise<TestResourceAtlas["home"]>>();

      const about = machine.exposeHybridPickR("en", "about");
      expectTypeOf(about).toEqualTypeOf<TestResourceAtlas["about"] | Promise<TestResourceAtlas["about"]>>();
    });
  });

  describe("RMachine with different atlas types", () => {
    it("should work with deeply nested resource types", () => {
      type DeepAtlas = {
        readonly nested: {
          level1: { level2: { level3: { value: string } } };
        };
      };
      const machine = createMachine<DeepAtlas>();
      expectTypeOf(machine.pickR("en", "nested")).toEqualTypeOf<Promise<DeepAtlas["nested"]>>();
    });

    it("should work with optional property resource types", () => {
      type OptionalAtlas = {
        readonly partial: {
          required: string;
          optional?: number;
        };
      };
      const machine = createMachine<OptionalAtlas>();
      expectTypeOf(machine.pickR("en", "partial")).toEqualTypeOf<Promise<OptionalAtlas["partial"]>>();
    });

    it("should work with generic resource types", () => {
      type GenericAtlas<T> = {
        readonly generic: { data: T };
      };
      const machine = createMachine<GenericAtlas<string>>();
      expectTypeOf(machine.pickR("en", "generic")).toEqualTypeOf<Promise<{ data: string }>>();
    });
  });

  describe("type compatibility", () => {
    it("pickR return type should be assignable to Promise of AnyR", async () => {
      const machine = createMachine<TestResourceAtlas>();
      const result = machine.pickR("en", "common");
      expectTypeOf(result).toExtend<Promise<object>>();
    });

    it("pickRKit return type should be assignable to Promise of readonly array", () => {
      const machine = createMachine<TestResourceAtlas>();
      const result = machine.pickRKit("en", "common", "home");
      expectTypeOf(result).toExtend<Promise<readonly object[]>>();
    });

    it("narrower atlas should not be assignable to wider machine type", () => {
      type NarrowAtlas = {
        readonly common: { greeting: string };
      };
      type WideAtlas = {
        readonly common: { greeting: string };
        readonly home: { title: string };
      };
      const narrowMachine = createMachine<NarrowAtlas>();
      expectTypeOf(narrowMachine).not.toExtend<RMachine<WideAtlas, string, EmptyFmtProvider>>();
    });
  });

  describe("method chaining and composition", () => {
    it("should allow storing pickR in a typed variable", () => {
      const machine = createMachine<TestResourceAtlas>();
      const pickCommon: () => Promise<TestResourceAtlas["common"]> = () => machine.pickR("en", "common");
      expectTypeOf(pickCommon).toBeFunction();
    });

    it("should allow mapping over pickRKit result", async () => {
      const machine = createMachine<TestResourceAtlas>();
      const kit = await machine.pickRKit("en", "common", "home");
      const mapped = [kit[0], kit[1]] as const;
      expectTypeOf(mapped[0]).toEqualTypeOf<TestResourceAtlas["common"]>();
      expectTypeOf(mapped[1]).toEqualTypeOf<TestResourceAtlas["home"]>();
    });

    it("should work with Promise.all for multiple pickR calls", async () => {
      const machine = createMachine<TestResourceAtlas>();
      const results = await Promise.all([
        machine.pickR("en", "common"),
        machine.pickR("en", "home"),
        machine.pickR("en", "about"),
      ]);
      expectTypeOf(results[0]).toEqualTypeOf<TestResourceAtlas["common"]>();
      expectTypeOf(results[1]).toEqualTypeOf<TestResourceAtlas["home"]>();
      expectTypeOf(results[2]).toEqualTypeOf<TestResourceAtlas["about"]>();
    });
  });

  describe("edge cases", () => {
    it("should handle atlas with many namespaces", () => {
      type LargeAtlas = {
        readonly ns1: { v: 1 };
        readonly ns2: { v: 2 };
        readonly ns3: { v: 3 };
        readonly ns4: { v: 4 };
        readonly ns5: { v: 5 };
        readonly ns6: { v: 6 };
        readonly ns7: { v: 7 };
        readonly ns8: { v: 8 };
        readonly ns9: { v: 9 };
        readonly ns10: { v: 10 };
      };
      const machine = createMachine<LargeAtlas>();
      expectTypeOf(machine.pickR("en", "ns5")).toEqualTypeOf<Promise<{ v: 5 }>>();
    });

    it("should handle namespace names with special characters", () => {
      type SpecialAtlas = {
        readonly "my-namespace": { value: string };
        readonly "my.namespace": { value: number };
        readonly my_namespace: { value: boolean };
      };
      const machine = createMachine<SpecialAtlas>();
      expectTypeOf(machine.pickR("en", "my-namespace")).toEqualTypeOf<Promise<{ value: string }>>();
      expectTypeOf(machine.pickR("en", "my.namespace")).toEqualTypeOf<Promise<{ value: number }>>();
      expectTypeOf(machine.pickR("en", "my_namespace")).toEqualTypeOf<Promise<{ value: boolean }>>();
    });

    it("should work with empty pickRKit call", () => {
      const machine = createMachine<TestResourceAtlas>();
      const result = machine.pickRKit("en");
      expectTypeOf(result).toEqualTypeOf<Promise<RKit<TestResourceAtlas, readonly []>>>();
    });
  });

  describe("RMachineLocale utility type", () => {
    it("should extract locale from RMachine instance", () => {
      type Machine = RMachine<TestResourceAtlas, "en" | "it", EmptyFmtProvider>;
      expectTypeOf<RMachineLocale<Machine>>().toEqualTypeOf<"en" | "it">();
    });

    it("should extract wide locale from RMachine with string locale", () => {
      type Machine = RMachine<TestResourceAtlas, string, EmptyFmtProvider>;
      expectTypeOf<RMachineLocale<Machine>>().toEqualTypeOf<string>();
    });
  });

  describe("RMachineRCtx utility type", () => {
    it("should extract RCtx with locale from RMachine (no formatters)", () => {
      const machine = createNarrowMachine<TestResourceAtlas>();
      type Ctx = RMachineRCtx<typeof machine>;
      expectTypeOf<Ctx>().toHaveProperty("locale").toEqualTypeOf<"en" | "it">();
      expectTypeOf<Ctx>().toHaveProperty("namespace").toBeString();
    });

    it("should extract RCtx with locale from RMachine (with formatters)", () => {
      const Formatters = FormattersSeed.create((_locale: "en" | "it") => ({ date: (d: Date) => d.toISOString() }));
      type FPC = typeof Formatters;
      const machine = new RMachine<TestResourceAtlas, "en" | "it", InstanceType<FPC>>(narrowConfig as any, {
        Formatters,
      });
      type Ctx = RMachineRCtx<typeof machine>;
      expectTypeOf<Ctx>().toHaveProperty("locale").toEqualTypeOf<"en" | "it">();
      expectTypeOf<Ctx>().toHaveProperty("namespace").toBeString();
    });
  });
});
