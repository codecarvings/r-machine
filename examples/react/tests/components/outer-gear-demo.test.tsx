import { mockPlug } from "@r-machine/testing";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { OuterGearDemo } from "@/components/showcase/views/outer-gear-demo";

afterEach(() => {
  cleanup();
});

// A real plug consumer rendered WITHOUT a <ReactRMachine> provider.
// mockPlug(OuterGearDemo) enters test mode (relaxes the provider guard) and returns a
// controller; ctrl.deps[0] drives the REAL outer/timer state, so the real
// getters/cell/action run and a click re-renders through real reactivity.
describe("OuterGearDemo (component, no provider)", () => {
  it("renders the seeded timer state and reacts to the real add() action", async () => {
    using ctrl = mockPlug(OuterGearDemo).with({ $: { ambientLocale: "it" } });
    ctrl.deps[0].state = { value: 4, isOdd: false };

    await act(async () => {
      render(<OuterGearDemo />);
    });

    expect(await screen.findByText("4")).toBeInTheDocument();
    expect(screen.getByText("pari")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument(); // doubled cell (4 * 2)

    // Click +10 → real `add` action publishes to the cell → wire re-renders.
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "+10" }));
    });

    expect(screen.getByText("14")).toBeInTheDocument();
    expect(screen.getByText("28")).toBeInTheDocument(); // doubled cell (14 * 2)
  });

  // A second test on the same component mocks it again: the first mock was reset
  // when its `using` scope closed, so this one starts from its own seed.
  it("flips the odd/even badge through the real relay when +1 crosses parity", async () => {
    using ctrl = mockPlug(OuterGearDemo).with({ $: { ambientLocale: "it" } });
    ctrl.deps[0].state = { value: 7, isOdd: true };

    await act(async () => {
      render(<OuterGearDemo />);
    });

    expect(await screen.findByText("7")).toBeInTheDocument();
    expect(screen.getByText("dispari")).toBeInTheDocument();

    // Click +1 → `add` makes the value even → the relay derives `isOdd: false`.
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "+1" }));
    });

    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("pari")).toBeInTheDocument();
  });
});
