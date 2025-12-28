import { declarePaths } from "./path.js";

export const paths = declarePaths({
  "/about": {
    it: "/chi-siamo",

    "/[...details]": {},
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
