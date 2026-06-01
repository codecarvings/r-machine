"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ClientPlug } from "@/r-machine/client-toolset";
import type { Product } from "@/r-machine/inner/catalog";

// Client island on the (server-rendered) product page. The product data arrives
// as plain props from the server component that read `inner/catalog`; this button
// only touches the `outer/cart` state — it never imports the catalog gear, which
// the resource-validity matrix forbids for client/outer surfaces anyway.
export const plug = ClientPlug("outer/cart", "shell/product");

export function AddToCartButton({ product }: { product: Pick<Product, "id" | "name" | "price"> }) {
  const [cart, s] = plug.useR();
  const [justAdded, setJustAdded] = useState(false);

  return (
    <Button
      size="lg"
      onClick={() => {
        cart.addItem({ productId: product.id, name: product.name, unitPrice: product.price });
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 1500);
      }}
    >
      {justAdded ? s.added : s.addToCart}
    </Button>
  );
}
