"use server";

import type { CartLine } from "@/r-machine/pub/outer/cart";

/**
 * SSR-hydration snapshot source, passed as a PORT into `outer/cart`.
 *
 * `outer/cart` runs on BOTH the server (request scope) and the client
 * (re-run during hydration). A `"use server"` function is isomorphic: it runs
 * in-process during the server render and as a hidden RPC during client
 * hydration. For the two renders to match (no hydration warning) it MUST be
 * deterministic for the request — here a fixed snapshot.
 *
 * In production it would read the cart from the DB / request session, returning
 * the SAME snapshot for both calls of one request. `unitPrice` is a snapshot of
 * the price at add-time, which is why the cart is self-contained and does not
 * depend on `inner/catalog`.
 */
export async function loadCartSnapshot(): Promise<{ lines: CartLine[] }> {
  return {
    lines: [{ productId: "kbd-01", name: "Mechanical Keyboard", unitPrice: 129.99, qty: 1 }],
  };
}
