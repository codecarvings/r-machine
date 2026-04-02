import type { RShape } from "r-machine";
import { gear } from "@/r-machine/setup";

export const r = gear(async () => {
  // Simulate a delay to force display of loading state
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return {
    title: "React Integration",
    description: (
      <>
        <span className="font-semibold">Hooks and components with automatic re-rendering.</span>
        Seamless integration with your existing React applications.
      </>
    ),
    badge: "React",
  };
});

export type R_Shell_Features_Box_3 = RShape<typeof r>;
