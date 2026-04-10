import { Forge, type RShape } from "../setup";

export const r = Forge.reactive({ items: [] as string[] }).gear((plugin, _) => {
  const { $ } = plugin;
  return {
    addItem: _.action((item: string) => ({ items: [...$.state.items, item] })),
    totalItems: _.getter(() => $.state.items.length),
  };
});

export type Gear_ShoppingCart = RShape<typeof r>;
