import { localized } from "@/r-machine/setup";

export const r = localized("shell/common", {
  title: (locale: string) => `[${locale}] - R-Machine ⧹ Examples ⧹ Next App ⧹ Path Strategy`,
  footer: {
    message: (
      <>
        Progetto di esempio <strong>R-Machine</strong>. Scopri di più su
        <a href="https://r-machine.codecarvings.com/it/" className="underline ml-1 font-semibold">
          r-machine.codecarvings.com/it
        </a>
      </>
    ),
  },
});
