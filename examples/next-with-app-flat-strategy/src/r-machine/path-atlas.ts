import { createPathAtlasDecl } from "@r-machine/next";

export class PathAtlas {
  decl = createPathAtlasDecl({
    "/example-static": {
      "/page-1": {},
      "/page-2": {},
    },
    "/example-dynamic": {
      "/[slug]": {},
    },
  });
}
