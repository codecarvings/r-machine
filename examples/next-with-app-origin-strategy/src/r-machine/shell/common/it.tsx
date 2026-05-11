import { localized, Shell } from "@/r-machine/setup";

export const r = Shell.define(({ $ }) =>
  localized("shell/common", {
    title: `[${$.locale}] - R-Machine ⧹ Examples ⧹ Next App ⧹ Origin Strategy`,
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
  })
);
