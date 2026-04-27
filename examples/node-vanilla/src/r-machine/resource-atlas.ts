import { defineLayout } from "r-machine";
import type { Hub_Config } from "./hub/config";
import type { Hub_Mid } from "./hub/mid";
import type { Inner_Db } from "./inner/db";
import type { Outer_Aggregator } from "./outer/aggregator";
import type { Outer_Counter } from "./outer/counter";
import type { Outer_Gear1 } from "./outer/gear1";
import type { Outer_ShoppingCart } from "./outer/shopping-cart";
import type { Shell_Common } from "./shell/common/en";
import type { Shell_Common2 } from "./shell/common2/en";
import type { Shell_Lib_Fmt } from "./shell/lib/fmt";
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
  "inner/db": Inner_Db;

  "hub/config": Hub_Config;
  "hub/mid": Hub_Mid;

  "outer/aggregator": Outer_Aggregator;
  "outer/shopping-cart": Outer_ShoppingCart;
  "outer/counter": Outer_Counter;
  "outer/gear1": Outer_Gear1;

  "vertex/timer": Vertex_Timer;

  "shell/common": Shell_Common;
  "shell/common2": Shell_Common2;
  "shell/lib/fmt": Shell_Lib_Fmt;
};

export class ResourceAtlas extends folders<ResourceMap>() {}
const token = ResourceAtlas.getTokenBuilder();

export const cart = token("outer/shopping-cart");
