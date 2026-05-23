import type { RShape } from "@/r-machine/setup";

export const r = {
  footer: {
    message: (
      <>
        <strong>R-Machine</strong> example project. Learn more at
        <a href="https://rmachine.dev" className="underline ml-1 font-semibold">
          rmachine.dev
        </a>
      </>
    ),
  },
};

export type Shell_Common = RShape<typeof r>;
