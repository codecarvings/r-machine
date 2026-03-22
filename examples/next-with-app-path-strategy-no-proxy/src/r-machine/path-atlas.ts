import { PathAtlasSeed } from "@r-machine/next";

// Declaring the path atlas as a named class gives a readable type name (PathAtlas)
// instead of the verbose generic type that PathAtlasSeed.create() would infer.
export class PathAtlas extends PathAtlasSeed.create({
  "/example-static": {
    "/page-1": {},
    "/page-2": {},
  },
  "/example-dynamic": {
    "/[slug]": {},
  },
}) {}
