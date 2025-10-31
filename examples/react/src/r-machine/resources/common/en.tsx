import type { R } from "r-machine";

const r = {
  footer: {
    message: (
      <>
        <strong>R-Machine</strong> example project. Learn more at
        <a href="https://r-machine.codecarvings.com/en/" className="underline ml-1 font-semibold">
          r-machine.codecarvings.com/en
        </a>
      </>
    ),
  },
};

export default r;
export type R_Common = R<typeof r>;
