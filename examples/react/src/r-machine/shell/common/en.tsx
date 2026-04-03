import type { R } from "@/r-machine/setup";

export const r = {
  footer: {
    message: (
      <>
        <strong>R-Machine</strong> example project. Learn more at
        <a href="https://r-machine.codecarvings.com" className="underline ml-1 font-semibold">
          r-machine.codecarvings.com
        </a>
      </>
    ),
  },
};

export type Shell_Common = R<typeof r>;
