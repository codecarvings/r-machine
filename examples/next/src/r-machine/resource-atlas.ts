import { defineLayout } from "r-machine";
import type { Base_Config } from "./base/config";
import type { Outer_Timer } from "./outer/timer";
import type { Shell_Common } from "./shell/common/en";
import type { Shell_LandingPage } from "./shell/landing-page/en";
import type { Shell_Lib_Fmt } from "./shell/lib/fmt";
import type { Vertex_Timer } from "./vertex/timer";

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
  "vertex/timer": Vertex_Timer;

  "shell/common": Shell_Common;
  "shell/landing-page": Shell_LandingPage;
  "shell/lib/fmt": Shell_Lib_Fmt;
};

export class ResourceAtlas extends folders<ResourceMap>() {}
const token = ResourceAtlas.getTokenBuilder();

export const fmt = token("shell/lib/fmt");
