import { PathAtlasSeed } from "@r-machine/next";

export class PathAtlas extends PathAtlasSeed.create({
  "/example-static": {
    "/page-1": {},
    "/page-2": {},
  },
  "/example-dynamic": {
    "/[slug]": {},
  },
}) {}
