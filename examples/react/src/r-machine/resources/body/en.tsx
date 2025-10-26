import type { R } from "r-machine";

const r = {
  header: {
    title: "Welcome to R-Machine",
    subTitle: "Modern internationalization for React applications",
  },
};

export default r;
export type R_Body = R<typeof r>;
