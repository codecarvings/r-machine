import { describe, expectTypeOf, it } from "vitest";
import type { LocaleHelper } from "../../../src/lib/locale-helper.js";
import type { AnyResourceAtlas, Namespace } from "../../../src/lib/r.js";
import type { NamespaceList, RKit } from "../../../src/lib/r-kit.js";
import { RMachine } from "../../../src/lib/r-machine.js";
import type { RMachineConfig } from "../../../src/lib/r-machine-config.js";
import type { R$ } from "../../../src/lib/r-module.js";

type TestResourceAtlas = {
  readonly common: { greeting: string; farewell: string };
  readonly home: { title: string; description: string };
  readonly about: { heading: string };
};

type FactoryResourceAtlas = {
  readonly common: ($: R$) => { greeting: string };
  readonly dynamic: ($: R$) => Promise<{ value: number }>;
};

type MixedResourceAtlas = {
  readonly static: { message: string };
  readonly factory: ($: R$) => { result: boolean };
  readonly asyncFactory: ($: R$) => Promise<{ data: string[] }>;
};

type SingleNamespaceAtlas = {
  readonly only: { single: string };
};

const mockConfig: RMachineConfig = {
  locales: ["en", "it"],
  defaultLocale: "en",
  rModuleResolver: async () => ({ default: {} }),
};

describe("RMachine", () => {
  describe("class definition", () => {
    it("should be a class constructor", () => {
      expectTypeOf(RMachine).toBeConstructibleWith(mockConfig);
    });

    it("should accept RMachineConfig as constructor parameter", () => {
      expectTypeOf(RMachine<TestResourceAtlas>).constructorParameters.toEqualTypeOf<[config: RMachineConfig]>();
    });

    it("should be generic over AnyResourceAtlas", () => {
      const machine = new RMachine<TestResourceAtlas>(mockConfig);
      expectTypeOf(machine).toBeObject();
    });

    it("should constrain generic parameter to AnyResourceAtlas", () => {
      expectTypeOf<RMachine<TestResourceAtlas>>().toBeObject();
      expectTypeOf<RMachine<FactoryResourceAtlas>>().toBeObject();
      expectTypeOf<RMachine<MixedResourceAtlas>>().toBeObject();
    });
  });

  describe("instance properties", () => {
    it("should have readonly config property", () => {
      const machine = new RMachine<TestResourceAtlas>(mockConfig);
      expectTypeOf(machine).toHaveProperty("config");
      expectTypeOf(machine.config).toEqualTypeOf<RMachineConfig>();
    });

    it("should have readonly localeHelper property", () => {
      const machine = new RMachine<TestResourceAtlas>(mockConfig);
      expectTypeOf(machine).toHaveProperty("localeHelper");
      expectTypeOf(machine.localeHelper).toEqualTypeOf<LocaleHelper>();
    });

    it("config property should be readonly", () => {
      type ConfigProperty = RMachine<TestResourceAtlas>["config"];
      expectTypeOf<ConfigProperty>().toEqualTypeOf<RMachineConfig>();
    });

    it("localeHelper property should be readonly", () => {
      type LocaleHelperProperty = RMachine<TestResourceAtlas>["localeHelper"];
      expectTypeOf<LocaleHelperProperty>().toEqualTypeOf<LocaleHelper>();
    });
  });

  describe("pickR method", () => {
    it("should be a function property", () => {
      const machine = new RMachine<TestResourceAtlas>(mockConfig);
      expectTypeOf(machine.pickR).toBeFunction();
    });

    it("should accept locale as first parameter", () => {
      const machine = new RMachine<TestResourceAtlas>(mockConfig);
      expectTypeOf(machine.pickR).parameter(0).toEqualTypeOf<string>();
    });

    it("should accept namespace as second parameter", () => {
      const machine = new RMachine<TestResourceAtlas>(mockConfig);
      expectTypeOf(machine.pickR).parameter(1).toEqualTypeOf<Namespace<TestResourceAtlas>>();
    });

    it("should return Promise of the resource type for the namespace", async () => {
      const machine = new RMachine<TestResourceAtlas>(mockConfig);
      const result = machine.pickR("en", "common");
      expectTypeOf(result).toEqualTypeOf<Promise<TestResourceAtlas["common"]>>();
    });

    it("should return correct type for different namespaces", async () => {
      const machine = new RMachine<TestResourceAtlas>(mockConfig);

      const common = machine.pickR("en", "common");
      expectTypeOf(common).toEqualTypeOf<Promise<{ greeting: string; farewell: string }>>();

      const home = machine.pickR("en", "home");
      expectTypeOf(home).toEqualTypeOf<Promise<{ title: string; description: string }>>();

      const about = machine.pickR("en", "about");
      expectTypeOf(about).toEqualTypeOf<Promise<{ heading: string }>>();
    });

    it("should infer namespace type from literal argument", () => {
      const machine = new RMachine<TestResourceAtlas>(mockConfig);
      const result = machine.pickR("en", "common");
      expectTypeOf(result).toEqualTypeOf<Promise<TestResourceAtlas["common"]>>();
    });

    it("should work with factory-based resource atlas", () => {
      const machine = new RMachine<FactoryResourceAtlas>(mockConfig);

      const common = machine.pickR("en", "common");
      expectTypeOf(common).toEqualTypeOf<Promise<($: R$) => { greeting: string }>>();

      const dynamic = machine.pickR("en", "dynamic");
      expectTypeOf(dynamic).toEqualTypeOf<Promise<($: R$) => Promise<{ value: number }>>>();
    });

    it("should work with mixed resource atlas", () => {
      const machine = new RMachine<MixedResourceAtlas>(mockConfig);

      const staticR = machine.pickR("en", "static");
      expectTypeOf(staticR).toEqualTypeOf<Promise<{ message: string }>>();

      const factory = machine.pickR("en", "factory");
      expectTypeOf(factory).toEqualTypeOf<Promise<($: R$) => { result: boolean }>>();

      const asyncFactory = machine.pickR("en", "asyncFactory");
      expectTypeOf(asyncFactory).toEqualTypeOf<Promise<($: R$) => Promise<{ data: string[] }>>>();
    });

    it("should work with single namespace atlas", () => {
      const machine = new RMachine<SingleNamespaceAtlas>(mockConfig);
      const result = machine.pickR("en", "only");
      expectTypeOf(result).toEqualTypeOf<Promise<{ single: string }>>();
    });

    it("should be bound correctly when destructured", () => {
      const machine = new RMachine<TestResourceAtlas>(mockConfig);
      const { pickR } = machine;
      expectTypeOf(pickR).toBeFunction();
      expectTypeOf(pickR("en", "common")).toEqualTypeOf<Promise<TestResourceAtlas["common"]>>();
    });
  });

  describe("pickRKit method", () => {
    it("should be a function property", () => {
      const machine = new RMachine<TestResourceAtlas>(mockConfig);
      expectTypeOf(machine.pickRKit).toBeFunction();
    });

    it("should accept locale as first parameter", () => {
      const machine = new RMachine<TestResourceAtlas>(mockConfig);
      expectTypeOf(machine.pickRKit).parameter(0).toEqualTypeOf<string>();
    });

    it("should accept rest namespaces parameter", () => {
      const machine = new RMachine<TestResourceAtlas>(mockConfig);
      type Params = Parameters<typeof machine.pickRKit>;
      expectTypeOf<Params[0]>().toEqualTypeOf<string>();
    });

    it("should return Promise of RKit type", () => {
      const machine = new RMachine<TestResourceAtlas>(mockConfig);
      const result = machine.pickRKit("en", "common", "home");
      expectTypeOf(result).toEqualTypeOf<Promise<RKit<TestResourceAtlas, readonly ["common", "home"]>>>();
    });

    it("should return correct tuple type for single namespace", () => {
      const machine = new RMachine<TestResourceAtlas>(mockConfig);
      const result = machine.pickRKit("en", "common");
      expectTypeOf(result).toEqualTypeOf<Promise<RKit<TestResourceAtlas, readonly ["common"]>>>();
    });

    it("should return correct tuple type for multiple namespaces", () => {
      const machine = new RMachine<TestResourceAtlas>(mockConfig);
      const result = machine.pickRKit("en", "common", "home", "about");
      expectTypeOf(result).toEqualTypeOf<Promise<RKit<TestResourceAtlas, readonly ["common", "home", "about"]>>>();
    });

    it("should preserve namespace order in result type", async () => {
      const machine = new RMachine<TestResourceAtlas>(mockConfig);

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
      const machine = new RMachine<FactoryResourceAtlas>(mockConfig);
      const result = machine.pickRKit("en", "common", "dynamic");
      expectTypeOf(result).toEqualTypeOf<Promise<RKit<FactoryResourceAtlas, readonly ["common", "dynamic"]>>>();
    });

    it("should work with mixed resource atlas", () => {
      const machine = new RMachine<MixedResourceAtlas>(mockConfig);
      const result = machine.pickRKit("en", "static", "factory", "asyncFactory");
      expectTypeOf(result).toEqualTypeOf<
        Promise<RKit<MixedResourceAtlas, readonly ["static", "factory", "asyncFactory"]>>
      >();
    });

    it("should be bound correctly when destructured", () => {
      const machine = new RMachine<TestResourceAtlas>(mockConfig);
      const { pickRKit } = machine;
      expectTypeOf(pickRKit).toBeFunction();
      expectTypeOf(pickRKit("en", "common", "home")).toEqualTypeOf<
        Promise<RKit<TestResourceAtlas, readonly ["common", "home"]>>
      >();
    });

    it("should allow duplicate namespaces in tuple", () => {
      const machine = new RMachine<TestResourceAtlas>(mockConfig);
      const result = machine.pickRKit("en", "common", "common");
      expectTypeOf(result).toEqualTypeOf<Promise<RKit<TestResourceAtlas, readonly ["common", "common"]>>>();
    });
  });

  describe("type inference", () => {
    it("namespace parameter should be constrained to atlas keys", () => {
      type TestMachine = RMachine<TestResourceAtlas>;
      type PickRNamespace = Parameters<TestMachine["pickR"]>[1];
      expectTypeOf<PickRNamespace>().toEqualTypeOf<"common" | "home" | "about">();
    });

    it("namespace parameter should work with single namespace atlas", () => {
      type SingleMachine = RMachine<SingleNamespaceAtlas>;
      type PickRNamespace = Parameters<SingleMachine["pickR"]>[1];
      expectTypeOf<PickRNamespace>().toEqualTypeOf<"only">();
    });

    it("should preserve resource property types through pickR", async () => {
      const machine = new RMachine<TestResourceAtlas>(mockConfig);
      const common = await machine.pickR("en", "common");
      expectTypeOf(common.greeting).toEqualTypeOf<string>();
      expectTypeOf(common.farewell).toEqualTypeOf<string>();
    });

    it("should preserve resource property types through pickRKit", async () => {
      const machine = new RMachine<TestResourceAtlas>(mockConfig);
      const kit = await machine.pickRKit("en", "common", "home");
      expectTypeOf(kit[0].greeting).toEqualTypeOf<string>();
      expectTypeOf(kit[0].farewell).toEqualTypeOf<string>();
      expectTypeOf(kit[1].title).toEqualTypeOf<string>();
      expectTypeOf(kit[1].description).toEqualTypeOf<string>();
    });
  });

  describe("protected members accessibility", () => {
    it("hybridPickR should not be accessible on instance", () => {
      const machine = new RMachine<TestResourceAtlas>(mockConfig);
      expectTypeOf(machine).not.toHaveProperty("hybridPickR");
    });

    it("hybridPickRKit should not be accessible on instance", () => {
      const machine = new RMachine<TestResourceAtlas>(mockConfig);
      expectTypeOf(machine).not.toHaveProperty("hybridPickRKit");
    });

    it("domainManager should not be accessible on instance", () => {
      const machine = new RMachine<TestResourceAtlas>(mockConfig);
      expectTypeOf(machine).not.toHaveProperty("domainManager");
    });

    it("validateLocaleForPick should not be accessible on instance", () => {
      const machine = new RMachine<TestResourceAtlas>(mockConfig);
      expectTypeOf(machine).not.toHaveProperty("validateLocaleForPick");
    });
  });

  describe("subclass access to protected members", () => {
    class TestableRMachine<RA extends AnyResourceAtlas> extends RMachine<RA> {
      public exposeHybridPickR<N extends Namespace<RA>>(locale: string, namespace: N) {
        return this.hybridPickR(locale, namespace);
      }
      public exposeHybridPickRKit<NL extends NamespaceList<RA>>(locale: string, ...namespaces: NL) {
        return this.hybridPickRKit(locale, ...namespaces);
      }
    }

    it("hybridPickR should return union of sync and async types", () => {
      const machine = new TestableRMachine<TestResourceAtlas>(mockConfig);
      const result = machine.exposeHybridPickR("en", "common");
      expectTypeOf(result).toEqualTypeOf<TestResourceAtlas["common"] | Promise<TestResourceAtlas["common"]>>();
    });

    it("hybridPickRKit should return union of sync and async types", () => {
      const machine = new TestableRMachine<TestResourceAtlas>(mockConfig);
      const result = machine.exposeHybridPickRKit("en", "common", "home");
      type Expected =
        | RKit<TestResourceAtlas, readonly ["common", "home"]>
        | Promise<RKit<TestResourceAtlas, readonly ["common", "home"]>>;
      expectTypeOf(result).toEqualTypeOf<Expected>();
    });

    it("hybridPickR should preserve namespace type in return", () => {
      const machine = new TestableRMachine<TestResourceAtlas>(mockConfig);

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
          level1: {
            level2: {
              level3: {
                value: string;
              };
            };
          };
        };
      };
      const machine = new RMachine<DeepAtlas>(mockConfig);
      const result = machine.pickR("en", "nested");
      expectTypeOf(result).toEqualTypeOf<Promise<DeepAtlas["nested"]>>();
    });

    it("should work with array-containing resource types", () => {
      type ArrayAtlas = {
        readonly items: {
          list: string[];
          tuples: [number, string, boolean];
        };
      };
      const machine = new RMachine<ArrayAtlas>(mockConfig);
      const result = machine.pickR("en", "items");
      expectTypeOf(result).toEqualTypeOf<Promise<ArrayAtlas["items"]>>();
    });

    it("should work with function-containing resource types", () => {
      type FuncAtlas = {
        readonly utils: {
          format: (value: number) => string;
          parse: (input: string) => number;
        };
      };
      const machine = new RMachine<FuncAtlas>(mockConfig);
      const result = machine.pickR("en", "utils");
      expectTypeOf(result).toEqualTypeOf<Promise<FuncAtlas["utils"]>>();
    });

    it("should work with optional property resource types", () => {
      type OptionalAtlas = {
        readonly partial: {
          required: string;
          optional?: number;
        };
      };
      const machine = new RMachine<OptionalAtlas>(mockConfig);
      const result = machine.pickR("en", "partial");
      expectTypeOf(result).toEqualTypeOf<Promise<OptionalAtlas["partial"]>>();
    });

    it("should work with union type resource values", () => {
      type UnionAtlas = {
        readonly mixed: {
          value: string | number | boolean;
        };
      };
      const machine = new RMachine<UnionAtlas>(mockConfig);
      const result = machine.pickR("en", "mixed");
      expectTypeOf(result).toEqualTypeOf<Promise<UnionAtlas["mixed"]>>();
    });

    it("should work with readonly resource types", () => {
      type ReadonlyAtlas = {
        readonly immutable: {
          readonly value: string;
          readonly items: readonly string[];
        };
      };
      const machine = new RMachine<ReadonlyAtlas>(mockConfig);
      const result = machine.pickR("en", "immutable");
      expectTypeOf(result).toEqualTypeOf<Promise<ReadonlyAtlas["immutable"]>>();
    });

    it("should work with generic resource types", () => {
      type GenericAtlas<T> = {
        readonly generic: {
          data: T;
        };
      };
      const machine = new RMachine<GenericAtlas<string>>(mockConfig);
      const result = machine.pickR("en", "generic");
      expectTypeOf(result).toEqualTypeOf<Promise<{ data: string }>>();
    });
  });

  describe("type compatibility", () => {
    it("RMachine should extend proper type constraints", () => {
      type Machine = RMachine<TestResourceAtlas>;
      expectTypeOf<Machine>().toBeObject();
    });

    it("pickR return type should be assignable to Promise of AnyR", async () => {
      const machine = new RMachine<TestResourceAtlas>(mockConfig);
      const result = machine.pickR("en", "common");
      expectTypeOf(result).toExtend<Promise<object>>();
    });

    it("pickRKit return type should be assignable to Promise of readonly array", () => {
      const machine = new RMachine<TestResourceAtlas>(mockConfig);
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
      const narrowMachine = new RMachine<NarrowAtlas>(mockConfig);
      expectTypeOf(narrowMachine).not.toExtend<RMachine<WideAtlas>>();
    });
  });

  describe("method chaining and composition", () => {
    it("should allow storing pickR in a typed variable", () => {
      const machine = new RMachine<TestResourceAtlas>(mockConfig);
      const pickCommon: () => Promise<TestResourceAtlas["common"]> = () => machine.pickR("en", "common");
      expectTypeOf(pickCommon).toBeFunction();
    });

    it("should allow mapping over pickRKit result", async () => {
      const machine = new RMachine<TestResourceAtlas>(mockConfig);
      const kit = await machine.pickRKit("en", "common", "home");
      const mapped = [kit[0], kit[1]] as const;
      expectTypeOf(mapped[0]).toEqualTypeOf<TestResourceAtlas["common"]>();
      expectTypeOf(mapped[1]).toEqualTypeOf<TestResourceAtlas["home"]>();
    });

    it("should work with Promise.all for multiple pickR calls", async () => {
      const machine = new RMachine<TestResourceAtlas>(mockConfig);
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
      const machine = new RMachine<LargeAtlas>(mockConfig);
      expectTypeOf(machine.pickR("en", "ns5")).toEqualTypeOf<Promise<{ v: 5 }>>();
    });

    it("should handle namespace names with special characters", () => {
      type SpecialAtlas = {
        readonly "my-namespace": { value: string };
        readonly "my.namespace": { value: number };
        readonly my_namespace: { value: boolean };
      };
      const machine = new RMachine<SpecialAtlas>(mockConfig);
      expectTypeOf(machine.pickR("en", "my-namespace")).toEqualTypeOf<Promise<{ value: string }>>();
      expectTypeOf(machine.pickR("en", "my.namespace")).toEqualTypeOf<Promise<{ value: number }>>();
      expectTypeOf(machine.pickR("en", "my_namespace")).toEqualTypeOf<Promise<{ value: boolean }>>();
    });

    it("should work with empty pickRKit call", () => {
      const machine = new RMachine<TestResourceAtlas>(mockConfig);
      const result = machine.pickRKit("en");
      expectTypeOf(result).toEqualTypeOf<Promise<RKit<TestResourceAtlas, readonly []>>>();
    });
  });
});
