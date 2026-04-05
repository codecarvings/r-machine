import { type R, ReactivePlug } from "../setup";

export const plug = ReactivePlug().defaultState({ items: [] as string[] });

export const r = plug.Gear(() => {
  const { $, _ } = plug.use();
  return {
    addItem: _.action((item: string) => ({ items: [...$.state.items, item] })),
    totalItems: _.getter(() => $.state.items.length),
  };
});

export type Gear_ShoppingCart = R<typeof r>;
