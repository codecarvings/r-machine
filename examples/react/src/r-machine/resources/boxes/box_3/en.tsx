import type { R } from "r-machine";

const rFactory = async () => {
  // Simulate a delay to force display of loading state
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    title: "Developer Friendly",
    description: "Simple API for seamless internationalization",
  };
};

export default rFactory;
export type R_Boxes_Box_3 = R<typeof rFactory>;
