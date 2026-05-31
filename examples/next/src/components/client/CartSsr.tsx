"use client";

import { ClientPlug } from "@/r-machine/client-toolset";

export const plug = ClientPlug("outer/cart-ssr");

export function CartSsr() {
  const [cart] = plug.useR();
  return (
    <ul>
      {cart.items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
