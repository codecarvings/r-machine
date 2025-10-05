import type { R } from "r-machine";

const r_common = {
  title: "R-Machine example with Vite",
  welcomeMessage: "Welcome to R-Machine with Vite!",
};

export type R_Common = R<typeof r_common>;
export default r_common;
