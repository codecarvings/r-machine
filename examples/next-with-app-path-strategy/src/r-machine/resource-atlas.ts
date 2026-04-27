import { defineLayout } from "r-machine";
import type { Hub_Config } from "./hub/config";
import type { Inner_DB } from "./inner/db";
import type { Outer_ShoppingCart } from "./outer/shopping-cart";
import type { Shell_Common } from "./shell/common/en";
import type { Shell_ExampleDynamic } from "./shell/example-dynamic/en";
import type { Shell_ExampleStatic } from "./shell/example-static/en";
import type { Shell_Features_Box_1_2 } from "./shell/features/box_1_2/en";
import type { Shell_Features_Box_3 } from "./shell/features/box_3/en";
import type { Shell_Features_IntlDemo } from "./shell/features/intl_demo/en";
import type { Shell_LandingPage } from "./shell/landing-page/en";
import type { Shell_Lib_Fmt } from "./shell/lib/fmt";
import type { Shell_Navigation } from "./shell/navigation/en";
import type { Vertex_Timer } from "./vertex/timer";

const folders = defineLayout({
  "inner/": "gear:inner",
  "hub/": "gear:hub",
  "outer/": "gear:outer",
  "vertex/": "gear:outer(vertex)",
  "shell/": "shell",
  "shell/lib/": "shell(mono)",
});

type ResourceMap = {
  "inner/db": Inner_DB;

  "hub/config": Hub_Config;

  "outer/shopping-cart": Outer_ShoppingCart;

  "vertex/timer": Vertex_Timer;

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

export class ResourceAtlas extends folders<ResourceMap>() {}
const token = ResourceAtlas.getTokenBuilder();

export const cart = token("outer/shopping-cart");
export const fmt = token("shell/lib/fmt");
