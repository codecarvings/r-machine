import { PathAtlasSeed } from "@r-machine/next";

export class PathAtlas extends PathAtlasSeed.create({
  "/example-static": {
    it: "/esempio-statico",

    "/page-1": {
      it: "/pagina-1",
    },
    "/page-2": {
      en: "/page-2-in-english",
      it: "/pagina-2",
    },
  },
  "/example-dynamic": {
    it: "/esempio-dinamico",

    "/[slug]": {},
  },
}) {}
