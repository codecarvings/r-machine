import { mockPlug } from "@r-machine/testing";
import { describe, expect, it } from "vitest";
import { type Product, r } from "@/r-machine/prv/inner/catalog";

const FIXTURES: Product[] = [
  { id: "a", name: "Alpha", category: "audio", price: 10, blurb: "" },
  { id: "b", name: "Beta", category: "displays", price: 20, blurb: "" },
  { id: "c", name: "Gamma", category: "audio", price: 30, blurb: "" },
];

describe("Inner_Catalog", () => {
  it("resolves products through the async port and looks them up", async () => {
    // Mock only the async port; the real `base/store-config` dep resolves.
    // InnerGear resources are stateless — `using` just exits test mode on scope end.
    using ctrl = mockPlug(r).with({
      $: { ports: { fetchProducts: async () => FIXTURES } },
    });

    const catalog = await ctrl.createRes();

    expect(catalog.products).toHaveLength(3);
    expect(catalog.byId("b")?.name).toBe("Beta");
    expect(catalog.byId("missing")).toBeUndefined();
    expect(catalog.byCategory("audio").map((p) => p.id)).toEqual(["a", "c"]);
    expect(catalog.byCategory(null)).toHaveLength(3);
    // `categories` flows in from the real base gear.
    expect(catalog.categories).toEqual(["peripherals", "displays", "audio"]);
  });
});
