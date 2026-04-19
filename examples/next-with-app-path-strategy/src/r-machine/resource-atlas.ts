import { defineLayout } from "r-machine";
import type { Gear_Config } from "./gear/config";
import type { Gear_ShoppingCart } from "./gear/shopping-cart";
import type { Shell_Common } from "./shell/common/en";
import type { Shell_ExampleDynamic } from "./shell/example-dynamic/en";
import type { Shell_ExampleStatic } from "./shell/example-static/en";
import type { Shell_Features_Box_1_2 } from "./shell/features/box_1_2/en";
import type { Shell_Features_Box_3 } from "./shell/features/box_3/en";
import type { Shell_Features_IntlDemo } from "./shell/features/intl_demo/en";
import type { Shell_LandingPage } from "./shell/landing-page/en";
import type { Shell_Lib_Fmt } from "./shell/lib/fmt";
import type { Shell_Navigation } from "./shell/navigation/en";

// Define here your preferred folder structure
const layout = defineLayout({
  "gear/": "gear", // <-- Folder containing gear resources.
  "gear/vertex/": "vertex-gear", // <-- Folder containing vertex-gear resources (components).
  "shell/": "shell", // <-- Folder containing multi-file shell resources.
  "shell/lib/": "dynamic-shell", // <-- Folder containing single-file shell resources.
});

// Define here your atlas shape, matching the layout above.
type AtlasShape = {
  "gear/shopping-cart": Gear_ShoppingCart;
  "gear/config": Gear_Config;

  "shell/common": Shell_Common;
  "shell/navigation": Shell_Navigation;
  "shell/landing-page": Shell_LandingPage;
  "shell/features/box_1_2": Shell_Features_Box_1_2;
  "shell/features/box_3": Shell_Features_Box_3;
  "shell/features/intl_demo": Shell_Features_IntlDemo;
  "shell/example-static": Shell_ExampleStatic;
  "shell/example-dynamic": Shell_ExampleDynamic;

  "shell/lib/fmt": Shell_Lib_Fmt;
};

export class ResourceAtlas extends layout<AtlasShape>() {}
const token = ResourceAtlas.getTokenBuilder();

export const cart = token("gear/shopping-cart");
export const fmt = token("shell/lib/fmt");
