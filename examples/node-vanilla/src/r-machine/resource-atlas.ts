import { createTokenBuilder } from "r-machine";
import type { Gear_Counter } from "./gear/counter";
import type { Gear_ShoppingCart } from "./gear/shopping-cart";
import type { Shell_Common } from "./shell/common/en";
import type { Shell_Lib_Fmt } from "./shell/lib/fmt";

export type ResourceAtlas = {
  "gear/shopping-cart": Gear_ShoppingCart;
  "gear/counter": Gear_Counter;

  "shell/common": Shell_Common;
  "shell/lib/fmt": Shell_Lib_Fmt;
};

const token = createTokenBuilder<ResourceAtlas>();
export const cart = token("gear/shopping-cart");
