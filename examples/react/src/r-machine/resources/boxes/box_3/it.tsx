import type { R_Boxes_Box_3 } from "./en";

const rFactory = async () => {
  // Simulate a delay to force display of loading state
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    title: "Pensato per gli Sviluppatori",
    description: "API semplice per una facile internazionalizzazione",
  } satisfies R_Boxes_Box_3;
};

export default rFactory;
