import type { R_Common } from "./resources/common/en";
import type { R_ExampleDynamic } from "./resources/example-dynamic/en";
import type { R_ExampleStatic } from "./resources/example-static/en";
import type { R_Features_Box_1_2 } from "./resources/features/box_1_2/en";
import type { R_Features_Box_3 } from "./resources/features/box_3/en";
import type { R_LandingPage } from "./resources/landing-page/en";
import type { R_Navigation } from "./resources/navigation/en";

export type ResourceAtlas = {
  common: R_Common;
  navigation: R_Navigation;
  "landing-page": R_LandingPage;
  "features/box_1_2": R_Features_Box_1_2;
  "features/box_3": R_Features_Box_3;
  "example-static": R_ExampleStatic;
  "example-dynamic": R_ExampleDynamic;
};
