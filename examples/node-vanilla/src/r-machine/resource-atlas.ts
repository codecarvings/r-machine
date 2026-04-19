import { defineLayout } from "r-machine";
import type { Gear_Aggregator } from "./gear/aggregator";
import type { Gear_Config } from "./gear/config";
import type { Gear_Counter } from "./gear/counter";
import type { Gear_ShoppingCart } from "./gear/shopping-cart";
import type { Shell_Common } from "./shell/common/en";
import type { Shell_Common2 } from "./shell/common2/en";
import type { Shell_Lib_Fmt } from "./shell/lib/fmt";

// Define here your preferred folder structure
const layout = defineLayout({
  "gear/": "gear", // <-- Folder containing gear resources.
  "gear/vertex/": "vertex-gear", // <-- Folder containing vertex-gear resources (components).
  "shell/": "shell", // <-- Folder containing multi-file shell resources.
  "shell/lib/": "dynamic-shell", // <-- Folder containing single-file shell resources.
});

// Define here your atlas shape, matching the layout above.
type AtlasShape = {
  "gear/aggregator": Gear_Aggregator;
  "gear/config": Gear_Config;
  "gear/counter": Gear_Counter;
  "gear/shopping-cart": Gear_ShoppingCart;

  "shell/common": Shell_Common;
  "shell/common2": Shell_Common2;
  "shell/lib/fmt": Shell_Lib_Fmt;
};

export class ResourceAtlas extends layout<AtlasShape>() {}
const token = ResourceAtlas.getTokenBuilder();

export const cart = token("gear/shopping-cart");
