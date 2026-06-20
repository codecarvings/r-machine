// @vitest-environment jsdom

import { mockPlug } from "@r-machine/testing";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CartView, plug } from "@/components/client/cart-view";

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
// `<NextClientRMachine>` provider. We mock the COMPONENT's own plug:
// `mockPlug(plug)` enters test mode (relaxing the provider guard + locale) and
// returns a controller. `ctrl.deps[0].state` drives the REAL state of the
// `outer/cart` dependency's shared cell — no fake surface: the real getters
// (`lines`/`itemCount`/`subtotal`) and the real `removeItem` action run, so a
// UI interaction re-renders through the real reactivity (no manual rerender).
describe("CartView (component, it)", () => {
  it("drives the cart dependency's real state and reacts to the real removeItem", async () => {
    using ctrl = mockPlug(plug).with({ $: { ambientLocale: "it" } });
    // Seed the dependency's state BEFORE render → applied when the cart resolves.
    ctrl.deps[0].state = {
      lines: [
        { productId: "kbd-01", name: "Mechanical Keyboard", unitPrice: 129.99, qty: 1 },
        { productId: "mon-01", name: "4K Monitor", unitPrice: 1299, qty: 2 },
      ],
    };

    await act(async () => {
      render(<CartView />);
    });

    // Real getters read the seeded cell; money is EUR-formatted, count pluralized (it).
    expect(await screen.findByText("Mechanical Keyboard")).toBeInTheDocument();
    expect(screen.getByText("4K Monitor")).toBeInTheDocument();
    expect(screen.getByText("2.727,99 €")).toBeInTheDocument(); // 129.99 + 1299*2
    expect(screen.getByText("3 articoli")).toBeInTheDocument(); // 1 + 2

    // Click "Rimuovi" on the 4K Monitor → the REAL `removeItem` action publishes
    // to the shared cell → the wire re-renders. No manual rerender.
    const removeButtons = screen.getAllByRole("button", { name: "Rimuovi" });
    await act(async () => {
      fireEvent.click(removeButtons[1]);
    });

    expect(screen.queryByText("4K Monitor")).not.toBeInTheDocument();
    expect(screen.queryByText("2.727,99 €")).not.toBeInTheDocument(); // old subtotal gone
    expect(screen.getByText("1 articolo")).toBeInTheDocument(); // count updated (singular)

    // Observe the dependency's state through the controller after the action.
    expect((ctrl.deps[0].state as { lines: unknown[] }).lines).toHaveLength(1);
  });
});
