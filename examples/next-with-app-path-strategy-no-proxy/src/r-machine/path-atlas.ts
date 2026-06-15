import { declarePathAtlas } from "@r-machine/next";

export class PathAtlas extends declarePathAtlas().as({
  "/example-static": {
    "/page-1": {},
    "/page-2": {},
  },
  "/example-dynamic": {
    "/[slug]": {},
  },
}) {}
