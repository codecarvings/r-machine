import { defineLayout } from "r-machine";
import type { Base_Config } from "./base/config";
import type { Outer_Nav } from "./outer/nav";
import type { Outer_Operator } from "./outer/operator";
import type { Outer_Timer } from "./outer/timer";
import type { Shell_AsyncDemo } from "./shell/async-demo/en";
import type { Shell_Lib_Fmt } from "./shell/lib/fmt";
import type { Shell_Showcase } from "./shell/showcase/en";
import type { Vertex_Counter } from "./vertex/counter";

const folders = defineLayout({
  "base/": "gear:base",
  "outer/": "gear:outer",
  "vertex/": "gear:outer(vertex)",
  "shell/": "shell",
  "shell/lib/": "shell(mono)",
});

type ResourceMap = {
  "base/config": Base_Config;
  "outer/timer": Outer_Timer;
  "outer/operator": Outer_Operator;
  "outer/nav": Outer_Nav;
  "vertex/counter": Vertex_Counter;

  "shell/showcase": Shell_Showcase;
  "shell/async-demo": Shell_AsyncDemo;

  "shell/lib/fmt": Shell_Lib_Fmt;
};

export class ResourceAtlas extends folders<ResourceMap>() {}
const token = ResourceAtlas.getTokenBuilder();

export const fmt = token("shell/lib/fmt");
