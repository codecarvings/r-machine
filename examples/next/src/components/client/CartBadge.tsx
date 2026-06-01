"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ClientPlug } from "@/r-machine/client-toolset";

// Header cart indicator. Because `outer/cart` is browser-session state, the count
// stays live across navigation (and even survives the locale-switch navigation).
export const plug = ClientPlug("outer/cart");

export function CartBadge() {
  const [cart, $] = plug.useR();

  return (
    <Link href={$.getPath("/cart")} className="relative inline-flex items-center p-1" aria-label="Cart">
      <ShoppingCart className="size-5" />
      {cart.itemCount > 0 && (
        <Badge className="absolute -top-1 -right-1 size-5 justify-center rounded-full p-0 tabular-nums">
          {cart.itemCount}
        </Badge>
      )}
    </Link>
  );
}
