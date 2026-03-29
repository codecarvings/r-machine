import { describe, expectTypeOf, it } from "vitest";
import type { RKit } from "../../src/lib/r-kit.js";
import { RMachine, type RMachineLocale } from "../../src/lib/r-machine.js";
import type { RMachineConfig } from "../../src/lib/r-machine-config.js";
import type { AnyResourceAtlas, Namespace } from "../../src/lib/resource-atlas.js";
import type { LocaleHelper } from "../../src/locale/locale-helper.js";
import { TestableRMachine } from "../_fixtures/testable-r-machine.js";

type TestResourceAtlas = {
  readonly common: { greeting: string; farewell: string };
  readonly home: { title: string; description: string };
  readonly about: { heading: string };
};

type SingleNamespaceAtlas = {
  readonly only: { single: string };
};

const mockConfig: RMachineConfig<AnyResourceAtlas, string, any> = {
  resourceAtlas: {},
  locales: ["en", "it"],
  defaultLocale: "en",
  load: async () => ({ r: {} }),
  kit: {},
};

const narrowConfig: RMachineConfig<AnyResourceAtlas, "en" | "it", any> = {
  resourceAtlas: {},
  locales: ["en", "it"],
  defaultLocale: "en",
  load: async () => ({ r: {} }),
  kit: {},
};

function createMachine<RA extends AnyResourceAtlas>() {
  return new RMachine<RA, string, {}>(mockConfig as any);
}

function createNarrowMachine<RA extends AnyResourceAtlas>() {
  return new RMachine<RA, "en" | "it", {}>(narrowConfig as any);
}

describe("RMachine", () => {
  describe("static factory methods", () => {
    it("should produce an RMachine instance via constructor", () => {
      const machine = new RMachine(mockConfig);
      expectTypeOf(machine).toBeObject();
    });

    it("should preserve narrow locale types", () => {
      const machine = createNarrowMachine<TestResourceAtlas>();
      expectTypeOf(machine).toEqualTypeOf<RMachine<TestResourceAtlas, "en" | "it", {}>>();
    });

    it("should produce string locale when config uses string", () => {
      const machine = createMachine<TestResourceAtlas>();
      expectTypeOf(machine).toEqualTypeOf<RMachine<TestResourceAtlas, string, {}>>();
    });

    it("RMachine.create() returns a bundle with rMachine and R", () => {
      const bundle = RMachine.create({
        resourceAtlas: {} as TestResourceAtlas,
        locales: ["en", "it"] as const,
        defaultLocale: "en",
        load: async () => ({ r: {} }),
      });
      expectTypeOf(bundle.rMachine).toBeObject();
      expectTypeOf(bundle.R).toBeObject();
    });

    it("RMachine.create() with kit preserves kit type in bundle", () => {
      const bundle = RMachine.create({
        resourceAtlas: {} as TestResourceAtlas,
        locales: ["en", "it"] as const,
        defaultLocale: "en",
        load: async () => ({ r: {} }),
        kit: { nav: "common" as const },
      });
      expectTypeOf(bundle.rMachine).toBeObject();
    });
  });

  describe("class definition", () => {
    it("should reject RA types that do not extend AnyResourceAtlas", () => {
      // @ts-expect-error - number does not extend AnyResourceAtlas
      type _Invalid = RMachine<number, string, {}>;
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
    it("should return Promise of RKit type", () => {
      const machine = createMachine<TestResourceAtlas>();
      const result = machine.pickRKit("en", "common", "home");
      expectTypeOf(result).toEqualTypeOf<Promise<RKit<TestResourceAtlas, readonly ["common", "home"]>>>();
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

    it("should be bound correctly when destructured", () => {
      const machine = createMachine<TestResourceAtlas>();
      const { pickRKit } = machine;
      expectTypeOf(pickRKit).toBeFunction();
      expectTypeOf(pickRKit("en", "common", "home")).toEqualTypeOf<
        Promise<RKit<TestResourceAtlas, readonly ["common", "home"]>>
      >();
    });

    it("should reject namespace not in the resource atlas", () => {
      const machine = createNarrowMachine<TestResourceAtlas>();
      // @ts-expect-error - "invalid" is not a key of TestResourceAtlas
      machine.pickRKit("en", "invalid");
    });
  });

  describe("type inference", () => {
    it("namespace parameter should be constrained to atlas keys", () => {
      type TestMachine = RMachine<TestResourceAtlas, string, {}>;
      type PickRNamespace = Parameters<TestMachine["pickR"]>[1];
      expectTypeOf<PickRNamespace>().toEqualTypeOf<"common" | "home" | "about">();
    });

    it("namespace parameter should work with single namespace atlas", () => {
      type SingleMachine = RMachine<SingleNamespaceAtlas, string, {}>;
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
      const machine = new TestableRMachine<TestResourceAtlas>(mockConfig as any);
      const result = machine.exposeHybridPickR("en", "common");
      expectTypeOf(result).toEqualTypeOf<TestResourceAtlas["common"] | Promise<TestResourceAtlas["common"]>>();
    });

    it("hybridPickRKit should return union of sync and async types", () => {
      const machine = new TestableRMachine<TestResourceAtlas>(mockConfig as any);
      const result = machine.exposeHybridPickRKit("en", "common", "home");
      type Expected =
        | RKit<TestResourceAtlas, readonly ["common", "home"]>
        | Promise<RKit<TestResourceAtlas, readonly ["common", "home"]>>;
      expectTypeOf(result).toEqualTypeOf<Expected>();
    });
  });

  describe("RMachineLocale utility type", () => {
    it("should extract locale from RMachine instance", () => {
      type Machine = RMachine<TestResourceAtlas, "en" | "it", {}>;
      expectTypeOf<RMachineLocale<Machine>>().toEqualTypeOf<"en" | "it">();
    });

    it("should extract wide locale from RMachine with string locale", () => {
      type Machine = RMachine<TestResourceAtlas, string, {}>;
      expectTypeOf<RMachineLocale<Machine>>().toEqualTypeOf<string>();
    });
  });
});
