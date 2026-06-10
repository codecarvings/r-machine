"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClientPlug } from "@/r-machine/client-toolset";

// The full cart. State (item count, line totals, subtotal) comes from the
// reactive `outer/cart`; every money value flows through `$.kit.fmt.currency` and
// the count through `$.kit.fmt.plural`, so switching locale re-resolves the whole
// thing — language AND currency AND number grouping change at once.
export const plug = ClientPlug("outer/cart", "shell/cart");
export function CartView() {
  const [cart, s, $] = plug.useR();

  if (cart.lines.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{s.title}</h1>
        <p className="text-muted-foreground">{s.empty}</p>
        <Link href={$.getPath("/")} className="text-primary underline font-medium">
          {s.continueShopping}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{s.title}</h1>
        <p className="text-muted-foreground">{$.kit.fmt.plural(cart.itemCount, s.itemWord.one, s.itemWord.other)}</p>
      </div>

      <ul className="divide-y border rounded-lg">
        {cart.lines.map((l) => (
          <li key={l.productId} className="flex items-center gap-4 p-4">
            <span className="flex-1 font-medium">{l.name}</span>
            <input
              type="number"
              min={0}
              value={l.qty}
              onChange={(e) => cart.setQty(l.productId, Number(e.target.value))}
              className="w-16 border rounded-md px-2 py-1 bg-background text-foreground tabular-nums"
            />
            <span className="w-28 text-right font-semibold tabular-nums">
              {$.kit.fmt.currency(l.unitPrice * l.qty)}
            </span>
            <Button variant="ghost" size="icon-sm" onClick={() => cart.removeItem(l.productId)} aria-label={s.remove}>
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t pt-4">
        <span className="text-lg font-semibold">{s.subtotal}</span>
        <span className="text-2xl font-bold tabular-nums">{$.kit.fmt.currency(cart.subtotal)}</span>
      </div>

      <div className="flex justify-end">
        <Button size="lg">{s.checkout}</Button>
      </div>
    </div>
  );
}
