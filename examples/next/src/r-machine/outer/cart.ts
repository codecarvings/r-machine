import { loadCartSnapshot } from "../../lib/cart-port";
import { OuterGear, type RShape } from "../setup";

export interface CartLine {
  productId: string;
  name: string;
  /** Price captured at add-time — a snapshot, so the cart is self-contained. */
  unitPrice: number;
  qty: number;
}

// An OuterGear is the stateful, reactive resource. The resource-validity matrix
// forbids `outer → inner` deps, so the cart never reads `inner/catalog`: each
// line is denormalized and carries its own `unitPrice` snapshot. This is also
// the honest commerce model (price locked at add-to-cart). State is reactive —
// `subtotal` is a memoized cell that recomputes only when `lines` changes, and
// the relay observes changes for persistence / analytics.
export const r = OuterGear.withPorts({ loadCartSnapshot })
  .withState({ lines: [] as CartLine[] })
  .define(async (plugin, _) => {
    const { $ } = plugin;

    // SSR-hydration seed: the isomorphic port returns the same snapshot on the
    // server render and the client hydration, so the two renders match.
    _.action()(await $.ports.loadCartSnapshot());

    const addItem = _.action((line: Omit<CartLine, "qty"> & { qty?: number }) => {
      const qty = line.qty ?? 1;
      const existing = $.state.lines.find((l) => l.productId === line.productId);
      const lines = existing
        ? $.state.lines.map((l) => (l.productId === line.productId ? { ...l, qty: l.qty + qty } : l))
        : [...$.state.lines, { productId: line.productId, name: line.name, unitPrice: line.unitPrice, qty }];
      return { lines };
    });

    const removeItem = _.action((productId: string) => ({
      lines: $.state.lines.filter((l) => l.productId !== productId),
    }));

    const setQty = _.action((productId: string, qty: number) => ({
      lines:
        qty <= 0
          ? $.state.lines.filter((l) => l.productId !== productId)
          : $.state.lines.map((l) => (l.productId === productId ? { ...l, qty } : l)),
    }));

    const clear = _.action(() => ({ lines: [] as CartLine[] }));

    return {
      lines: _.getter(() => $.state.lines),
      itemCount: _.getter(() => $.state.lines.reduce((n, l) => n + l.qty, 0)),
      // Memoized: recomputes only when `lines` changes, not on every read.
      subtotal: _.cell(() => $.state.lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0)),
      addItem,
      removeItem,
      setQty,
      clear,
      $relay: _.relay({
        select: () => $.state.lines,
        onChange: (lines: CartLine[]) => {
          // Persistence / analytics hook. Deterministic for tests.
          console.log(`cart changed: ${lines.length} line(s)`);
        },
      }),
    };
  });

export type Outer_Cart = RShape<typeof r>;
