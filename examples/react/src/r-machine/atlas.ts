import type { R_Body } from "./resources/body/en";
import type { R_Boxes_Box_1_2 } from "./resources/boxes/box_1_2/en";
import type { R_Boxes_Box_3 } from "./resources/boxes/box_3/en";
import type { R_Common } from "./resources/common/en";

export type Atlas = {
  body: R_Body;
  common: R_Common;
  "boxes/box_1_2": R_Boxes_Box_1_2;
  "boxes/box_3": R_Boxes_Box_3;
};
