import { PathAtlasSeed } from "@r-machine/next";
import type { Locale } from "./setup";

// Declaring the path atlas as a named class gives a readable type name (PathAtlas)
// instead of the verbose generic type that PathAtlasSeed.create() would infer.
export class PathAtlas extends PathAtlasSeed.for<Locale>().create({
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
