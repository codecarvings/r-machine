import { type RShape, Shell } from "@/r-machine/setup";

export const r = Shell.define(async () => {
  // Simulate a delay to force display of loading state
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return {
    title: "Next.js Integration",
    description: (
      <>
        <span className="font-semibold">Hooks and components with automatic re-rendering.</span> Seamless integration
        with your existing Next.js applications.
      </>
    ),
    badge: "Next.js",
  };
});

export type Shell_Features_Box_3 = RShape<typeof r>;
