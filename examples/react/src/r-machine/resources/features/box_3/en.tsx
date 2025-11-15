import type { R } from "r-machine";

const rFactory = async () => {
  // Simulate a delay to force display of loading state
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return {
    title: "React Integration",
    description: (
      <>
        <span className="font-semibold">React hooks and components with automatic re-rendering.</span>
        Seamless integration with your existing React applications.
      </>
    ),
    badge: "React",
  };
};

export default rFactory;
export type R_Features_Box_3 = R<typeof rFactory>;
