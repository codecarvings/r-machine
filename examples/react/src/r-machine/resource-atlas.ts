import type { R_Common } from "./resources/common/en";
import type { R_Features_Box_1_2 } from "./resources/features/box_1_2/en";
import type { R_Features_Box_3 } from "./resources/features/box_3/en";
import type { R_Features_IntlDemo } from "./resources/features/intl_demo/en";
import type { R_LandingPage } from "./resources/landing-page/en";

export type ResourceAtlas = {
  common: R_Common;
  "landing-page": R_LandingPage;
  "features/box_1_2": R_Features_Box_1_2;
  "features/box_3": R_Features_Box_3;
  "features/intl_demo": R_Features_IntlDemo;
};
