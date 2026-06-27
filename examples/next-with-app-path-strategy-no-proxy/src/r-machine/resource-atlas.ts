import { defineLayout } from "r-machine";
import type { Base_Config } from "./pub/base/config";
import type { Outer_Timer } from "./pub/outer/timer";
import type { Shell_Common } from "./pub/shell/common/en";
import type { Shell_ExampleDynamic } from "./pub/shell/example-dynamic/en";
import type { Shell_ExampleStatic } from "./pub/shell/example-static/en";
import type { Shell_LandingPage } from "./pub/shell/landing-page/en";
import type { Shell_Lib_Fmt } from "./pub/shell/lib/fmt";
import type { Shell_Navigation } from "./pub/shell/navigation/en";

const folders = defineLayout({
  "inner/": "gear:inner",
  "base/": "gear:base",
  "outer/": "gear:outer",
  "vertex/": "gear:outer(vertex)",
  "shell/": "shell",
  "shell/lib/": "shell(mono)",
});

type ResourceMap = {
  "base/config": Base_Config;
  "outer/timer": Outer_Timer;

  "shell/common": Shell_Common;
  "shell/navigation": Shell_Navigation;
  "shell/landing-page": Shell_LandingPage;
  "shell/example-static": Shell_ExampleStatic;
  "shell/example-dynamic": Shell_ExampleDynamic;

  "shell/lib/fmt": Shell_Lib_Fmt;
};

export class ResourceAtlas extends folders<ResourceMap>() {}
const token = ResourceAtlas.getTokenBuilder();

export const fmt = token("shell/lib/fmt");
