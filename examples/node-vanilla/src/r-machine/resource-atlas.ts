import { createTokenBuilder } from "r-machine";
import type { Gear_Aggregator } from "./gear/aggregator";
import type { Gear_Config } from "./gear/config";
import type { Gear_Counter } from "./gear/counter";
import type { Gear_ShoppingCart } from "./gear/shopping-cart";
import type { Shell_Common } from "./shell/common/en";
import type { Shell_Lib_Fmt } from "./shell/lib/fmt";

export type ResourceAtlas = {
  "gear/aggregator": Gear_Aggregator;
  "gear/config": Gear_Config;
  "gear/counter": Gear_Counter;
  "gear/shopping-cart": Gear_ShoppingCart;

  "shell/common": Shell_Common;
  "shell/lib/fmt": Shell_Lib_Fmt;
};

const token = createTokenBuilder<ResourceAtlas>();
export const cart = token("gear/shopping-cart");
