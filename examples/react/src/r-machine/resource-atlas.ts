import type { ResourceAtlasOf } from "r-machine";

export type ResourceAtlas = ResourceAtlasOf<{
  "shell/common": typeof import("./shell/common/en");
  "shell/landing-page": typeof import("./shell/landing-page/en");
  "shell/features/box_1_2": typeof import("./shell/features/box_1_2/en");
  "shell/features/box_3": typeof import("./shell/features/box_3/en");
  "shell/features/intl_demo": typeof import("./shell/features/intl_demo/en");

  "shell/lib/fmt": typeof import("./shell/lib/fmt");

  // TODO: WP
  "gear/shopping-cart": typeof import("./gear/shopping-cart");
}>;
