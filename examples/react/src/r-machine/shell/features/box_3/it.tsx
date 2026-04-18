import { localized, Shell } from "@/r-machine/setup";

export const r = Shell.define(async () => {
  // Simulate a delay to force display of loading state
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return localized("shell/features/box_3", {
    title: "Integrazione React",
    description: (
      <>
        <span className="font-semibold">Hook e componenti con re-rendering automatico.</span>
        Integrazione perfetta con le tue applicazioni React esistenti.
      </>
    ),
    badge: "React",
  });
});
