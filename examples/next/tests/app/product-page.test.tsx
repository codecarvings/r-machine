// @vitest-environment node

import { mockPlug } from "@r-machine/testing";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import ProductPage from "@/app/[locale]/product/[id]/page";
import { r as catalogR, type Product } from "@/r-machine/inner/catalog";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

// Collect raw text from a React element tree WITHOUT rendering it — client
// islands (e.g. <AddToCartButton/>) stay unexpanded, so we only see the
// server-resolved strings.
function treeText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") {
    return "";
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(treeText).join(" ");
  }
  const props = (node as { props?: { children?: ReactNode } }).props;
  return props ? treeText(props.children) : "";
}

const CATALOG: Product[] = [
  { id: "kbd-01", name: "Mechanical Keyboard", category: "peripherals", price: 129.99, blurb: "Clicky and crisp." },
];

// A server PAGE test. `mockPlug` seeds `inner/catalog` AND enters test mode, so
// `useR(params)` resolves server-side (no provider, no real request): it binds
// the locale from the route params and `validateServerOnlyUsage` is relaxed.
describe("ProductPage (server page, en)", () => {
  it("resolves via useR(params) and renders the seeded product, price formatted server-side", async () => {
    const { reset } = mockPlug(catalogR.plug).with({
      $: { ports: { fetchProducts: async () => CATALOG } },
    });

    const el = await ProductPage({ params: Promise.resolve({ locale: "en", id: "kbd-01" }) } as never);
    const text = treeText(el as ReactNode);

    expect(text).toContain("Mechanical Keyboard");
    expect(text).toContain("$129.99"); // fmt kit, en → USD
    expect(text).toContain("Peripherals"); // shell/catalog en category label

    reset();
  });
});
