import type { R_Common } from "./resources/common/en";
import type { R_Features_Box_1_2 } from "./resources/features/box_1_2/en";
import type { R_Features_Box_3 } from "./resources/features/box_3/en";
import type { R_LandingPage } from "./resources/landing-page/en";
import type { R_StartNowPage } from "./resources/start-now-page/en";

export type Atlas = {
  common: R_Common;
  "landing-page": R_LandingPage;
  "features/box_1_2": R_Features_Box_1_2;
  "features/box_3": R_Features_Box_3;
  "start-now-page": R_StartNowPage;
};
