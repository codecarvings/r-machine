import type { RShape } from "@/r-machine/setup";

export const r = {
  title: (locale: string) => `[${locale}] - R-Machine ⧹ Examples ⧹ Next App ⧹ Path Strategy`,
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

export type Shell_Common = RShape<typeof r>;
