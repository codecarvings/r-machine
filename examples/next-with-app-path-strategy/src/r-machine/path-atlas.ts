import { declarePathAtlas } from "@r-machine/next";
import type { Locale } from "./setup";

export class PathAtlas extends declarePathAtlas<Locale>().as({
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
