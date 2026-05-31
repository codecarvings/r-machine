import { loadCartSnapshot } from "../../lib/ssr-actions";
import { OuterGear, type RShape } from "../setup";

// SSR-hydration pattern (V1 alternative to withSerializer, planned for V2).
//
// The factory runs on BOTH the server (request scope, server action called
// in-process) and the client (re-run, server action called as a hidden RPC).
// `_.action()(await $.ports.loadCartSnapshot())` seeds the initial state from
// the snapshot. A deterministic snapshot makes both renders identical, so the
// suspended ClientPlug hydrates the server HTML without a mismatch warning.
export const r = OuterGear.withPorts({ loadCartSnapshot })
  .withState({ items: [] as string[] })
  .define(async (plugin, _) => {
    const { $ } = plugin;
    _.action()(await $.ports.loadCartSnapshot());

    return {
      items: _.getter(() => $.state.items),
      add: _.action((item: string) => ({ items: [...$.state.items, item] })),
    };
  });

export type Outer_CartSsr = RShape<typeof r>;
