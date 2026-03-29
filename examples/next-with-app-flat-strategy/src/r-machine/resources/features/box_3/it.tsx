import { R } from "@/r-machine/setup";
import type { R_Features_Box_3 } from "./en";

export const r = R.withType<R_Features_Box_3>().define(async () => {
  // Simulate a delay to force display of loading state
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return {
    title: "Integrazione Next.js",
    description: (
      <>
        <span className="font-semibold">Hook e componenti con re-rendering automatico.</span> Integrazione perfetta con
        le tue applicazioni Next.js esistenti.
      </>
    ),
    badge: "Next.js",
  };
});
