import type { ResourceAtlasShape } from "r-machine";

export type ResourceAtlas = ResourceAtlasShape<{
  "shell/lib/fmt": typeof import("./shell/lib/fmt");

  // TODO: WP
  "gear/shopping-cart": typeof import("./gear/shopping-cart");
}>;
