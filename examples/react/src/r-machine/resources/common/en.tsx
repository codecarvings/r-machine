import type { R } from "r-machine";

const r = {
  footer: {
    message: (
      <>
        This is a React example demonstrating{" "}
        <strong className="bg-slate-800 text-white rounded-xl px-2">R-Machine</strong> integration.
      </>
    ),
  },
};

export default r;
export type R_Common = R<typeof r>;
