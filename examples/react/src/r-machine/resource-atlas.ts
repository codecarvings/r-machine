import type { ResourceAtlasShape } from "r-machine";
import type { R_Gear_ShoppingCart } from "./gear/shopping-cart";
import type { R_Shell_Lib_Fmt } from "./shell/lib/fmt";

export type ResourceAtlas = ResourceAtlasShape<{
  "shell/lib/fmt": R_Shell_Lib_Fmt;

  // TODO: WP
  "gear/shopping-cart": R_Gear_ShoppingCart;
}>;
