import { defineLayout } from "r-machine";
import type { Outer_Operator } from "./outer/operator";
import type { Outer_Temp } from "./outer/temp";
import type { Outer_Timer } from "./outer/timer";
import type { Shell_Common } from "./shell/common/en";
import type { Shell_Exp } from "./shell/exp/en";
import type { Shell_Features_Box_1_2 } from "./shell/features/box_1_2/en";
import type { Shell_Features_Box_3 } from "./shell/features/box_3/en";
import type { Shell_Features_IntlDemo } from "./shell/features/intl_demo/en";
import type { Shell_LandingPage } from "./shell/landing-page/en";
import type { Shell_Lib_Fmt } from "./shell/lib/fmt";

const folders = defineLayout({
  "base/": "gear:base",
  "outer/": "gear:outer",
  "vertex/": "gear:outer(vertex)",
  "shell/": "shell",
  "shell/lib/": "shell(mono)",
});

type ResourceMap = {
  "outer/timer": Outer_Timer;
  "outer/operator": Outer_Operator;
  "outer/temp": Outer_Temp;
  "shell/exp": Shell_Exp;

  "shell/common": Shell_Common;
  "shell/landing-page": Shell_LandingPage;
  "shell/features/box_1_2": Shell_Features_Box_1_2;
  "shell/features/box_3": Shell_Features_Box_3;
  "shell/features/intl_demo": Shell_Features_IntlDemo;

  "shell/lib/fmt": Shell_Lib_Fmt;
};

export class ResourceAtlas extends folders<ResourceMap>() {}
const token = ResourceAtlas.getTokenBuilder();

export const fmt = token("shell/lib/fmt");
