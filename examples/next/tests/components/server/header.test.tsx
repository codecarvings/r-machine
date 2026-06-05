// @vitest-environment node

import { mockPlug } from "@r-machine/testing";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import Header from "@/components/server/header";
import { r as catalogR } from "@/r-machine/inner/catalog";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

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

// A server COMPONENT test for a component with its OWN plug, resolved via
// `useR()` with NO params. `.passthrough()` enters test mode without seeding any
// resource, so `Header` resolves `shell/common` at the machine's DEFAULT locale
// instead of throwing ERR_LOCALE_UNDETERMINED. The real (en) nav labels render.
describe("Header (server component, default locale)", () => {
  it("renders against the default locale under test mode (useR() with no params)", async () => {
    const reset = mockPlug(catalogR.plug).passthrough();

    const el = await Header();
    const text = treeText(el as ReactNode);

    expect(text).toContain("Catalog"); // shell/common en nav labels
    expect(text).toContain("Cart");
    expect(text).toContain("R-Mart");

    reset();
  });
});
