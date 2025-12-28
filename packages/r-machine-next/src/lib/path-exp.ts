import { declarePaths, getPath } from "./path.js";

export const paths = declarePaths({
  "/about": {
    it: "/chi-siamo",
  },
  "/blog": {
    fr: "/blogue",

    "/[postId]": {
      "/comments": {
        it: "/commenti",
      },
    },
  },
});

const x = getPath(paths, "/blog/[postId]");
