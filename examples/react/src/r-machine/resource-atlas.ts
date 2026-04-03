import type { R_Gear_ShoppingCart } from "./gear/shopping-cart";
import type { R_Shell_Common } from "./shell/common/en";
import type { R_Shell_Features_Box_1_2 } from "./shell/features/box_1_2/en";
import type { R_Shell_Features_Box_3 } from "./shell/features/box_3/en";
import type { R_Shell_Features_IntlDemo } from "./shell/features/intl_demo/en";
import type { R_Shell_LandingPage } from "./shell/landing-page/en";
import type { R_Shell_Lib_Fmt } from "./shell/lib/fmt";

export type ResourceAtlas = {
  "shell/common": R_Shell_Common;
  "shell/landing-page": R_Shell_LandingPage;
  "shell/features/box_1_2": R_Shell_Features_Box_1_2;
  "shell/features/box_3": R_Shell_Features_Box_3;
  "shell/features/intl_demo": R_Shell_Features_IntlDemo;

  "shell/lib/fmt": R_Shell_Lib_Fmt;

  // TODO: WP
  "gear/shopping-cart": R_Gear_ShoppingCart;
};
