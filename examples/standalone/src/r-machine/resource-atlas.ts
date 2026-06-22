import { defineLayout } from "r-machine";
import type { Base_Config } from "./base/config.ts";
import type { Shell_Greeting } from "./shell/greeting/en.ts";
import type { Shell_Lib_Fmt } from "./shell/lib/fmt.ts";

// Only the resource families DirectPlug can consume: base gears + shells.
// No outer/vertex gears (those need a stateful container, i.e. a strategy).
const folders = defineLayout({
  "base/": "gear:base",
  "shell/": "shell",
  "shell/lib/": "shell(mono)",
});

type ResourceMap = {
  "base/config": Base_Config;
  "shell/greeting": Shell_Greeting;
  "shell/lib/fmt": Shell_Lib_Fmt;
};

export class ResourceAtlas extends folders<ResourceMap>() {}
const token = ResourceAtlas.getTokenBuilder();

export const fmt = token("shell/lib/fmt");
