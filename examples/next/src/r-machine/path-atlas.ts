import { declarePathAtlas } from "@r-machine/next";
import type { Locale } from "./setup";

export class PathAtlas extends declarePathAtlas<Locale>().as({
  "/product": {
    "/[id]": {},
  },
  "/cart": {},
}) {}
