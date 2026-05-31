"use server";

/**
 * SSR-hydration snapshot source, passed as a PORT into `outer/cart-ssr`.
 *
 * A `"use server"` function is isomorphic: it runs in-process during the
 * server render, and as a hidden RPC during client hydration. For the two
 * renders to match (no hydration warning) it MUST be deterministic for the
 * request — here a fixed list. In production it would read from a DB / the
 * request session, returning the SAME snapshot for both calls of one request.
 */
export async function loadCartSnapshot(): Promise<{ items: string[] }> {
  return { items: ["Keyboard", "Mouse", "Monitor"] };
}
