// @vitest-environment jsdom

import { mockPlug } from "@r-machine/testing";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CartView } from "@/components/client/CartView";
import { r as cartR } from "@/r-machine/outer/cart";

// The Next client toolset reads next/navigation hooks during render; stub them.
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/cart",
}));

afterEach(() => {
  cleanup();
});

// A component test for a real plug consumer, rendered WITHOUT a
// `<NextClientRMachine>` provider: the SAME `mockPlug` primitive that seeds gears
// also seeds `outer/cart` and flips test mode, which relaxes the provider guard
// and falls back to the default locale. We assert the actual rendered (localized)
// DOM and that a UI interaction drives the reactive update.
describe("CartView (component, en)", () => {
  it("renders the mockPlug-seeded cart and reacts to removing a line", async () => {
    const reset = mockPlug(cartR.plug).with({
      $: {
        ports: {
          loadCartSnapshot: async () => ({
            lines: [
              { productId: "kbd-01", name: "Mechanical Keyboard", unitPrice: 129.99, qty: 1 },
              { productId: "mon-01", name: "4K Monitor", unitPrice: 1299, qty: 2 },
            ],
          }),
        },
      },
    });

    await act(async () => {
      render(<CartView />);
    });

    // Seeded lines render, money is USD-formatted, count is pluralized.
    expect(await screen.findByText("Mechanical Keyboard")).toBeInTheDocument();
    expect(screen.getByText("4K Monitor")).toBeInTheDocument();
    expect(screen.getByText("$2,727.99")).toBeInTheDocument(); // 129.99 + 1299*2
    expect(screen.getByText("3 items")).toBeInTheDocument(); // 1 + 2

    // Remove the 4K Monitor line → the reactive cart re-renders.
    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    await act(async () => {
      fireEvent.click(removeButtons[1]);
    });

    expect(screen.queryByText("4K Monitor")).not.toBeInTheDocument();
    expect(screen.queryByText("$2,727.99")).not.toBeInTheDocument(); // old subtotal gone
    expect(screen.getByText("1 item")).toBeInTheDocument(); // count updated (singular)

    reset();
  });
});
