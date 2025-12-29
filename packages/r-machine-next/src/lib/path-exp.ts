import { createPathAtlas, getPath } from "./path.js";

export const pathAtlas = createPathAtlas({
  "/about": {
    it: "/chi-siamo",
  },
  "/blog": {
    fr: "/blogue",

    "/[postId]": {
      "/comments": {
        it: "/commenti",

        "/[[...commentIds]]": {},
      },
    },
  },
});

// ✅ Valid: only required params
const x = getPath(pathAtlas, "/blog/[postId]");
