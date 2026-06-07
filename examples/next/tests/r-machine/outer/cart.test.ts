import { mockPlug } from "@r-machine/testing";
import { describe, expect, it, vitest } from "vitest";
import { r } from "@/r-machine/outer/cart";

// Seed the SSR snapshot port to an empty cart so each test starts clean.
const seedEmpty = () => mockPlug(r.plug).with({ $: { ports: { loadCartSnapshot: async () => ({ lines: [] }) } } });

describe("Outer_Cart", () => {
  it("adds distinct items and computes itemCount + subtotal", async () => {
    const { reset } = seedEmpty();
    const cart = await r.create();

    cart.addItem({ productId: "a", name: "Alpha", unitPrice: 10 });
    cart.addItem({ productId: "b", name: "Beta", unitPrice: 20, qty: 2 });

    expect(cart.lines()).toHaveLength(2);
    expect(cart.itemCount()).toBe(3); // 1 + 2
    expect(cart.subtotal()).toBe(50); // 10*1 + 20*2

    reset();
  });

  it("merges quantity when the same product is added twice", async () => {
    const { reset } = seedEmpty();
    const cart = await r.create();

    cart.addItem({ productId: "a", name: "Alpha", unitPrice: 10 });
    cart.addItem({ productId: "a", name: "Alpha", unitPrice: 10 });

    expect(cart.lines()).toHaveLength(1);
    expect(cart.itemCount()).toBe(2);
    expect(cart.subtotal()).toBe(20);

    reset();
  });

  it("setQty(0) and removeItem shrink the array (proves array replacement, not element-merge)", async () => {
    const { reset } = seedEmpty();
    const cart = await r.create();

    cart.addItem({ productId: "a", name: "Alpha", unitPrice: 10 });
    cart.addItem({ productId: "b", name: "Beta", unitPrice: 20 });
    expect(cart.lines()).toHaveLength(2);

    cart.setQty("a", 0);
    expect(cart.lines()).toHaveLength(1);
    expect(cart.lines()[0]?.productId).toBe("b");

    cart.removeItem("b");
    expect(cart.lines()).toHaveLength(0);
    expect(cart.subtotal()).toBe(0);

    reset();
  });

  it("setQty updates an existing line quantity", async () => {
    const { reset } = seedEmpty();
    const cart = await r.create();

    cart.addItem({ productId: "a", name: "Alpha", unitPrice: 10 });
    cart.setQty("a", 5);

    expect(cart.itemCount()).toBe(5);
    expect(cart.subtotal()).toBe(50);

    reset();
  });

  it("seeds initial state from the loadCartSnapshot port", async () => {
    const { reset } = mockPlug(r.plug).with({
      $: {
        ports: {
          loadCartSnapshot: async () => ({ lines: [{ productId: "x", name: "X", unitPrice: 7, qty: 3 }] }),
        },
      },
    });
    const cart = await r.create();

    expect(cart.lines()).toHaveLength(1);
    expect(cart.itemCount()).toBe(3);
    expect(cart.subtotal()).toBe(21);

    reset();
  });

  it("fires the relay onChange when lines change", async () => {
    const { reset } = seedEmpty();
    const logSpy = vitest.spyOn(console, "log").mockImplementation(() => {});
    const cart = await r.create();

    cart.addItem({ productId: "a", name: "Alpha", unitPrice: 10 });
    expect(logSpy).toHaveBeenCalledWith("cart changed: 1 line(s)");

    logSpy.mockRestore();
    reset();
  });
});
