import { localized } from "@/r-machine/setup";

export const r = localized("shell/common", {
  footer: {
    message: (
      <>
        Progetto di esempio <strong>R-Machine</strong>. Scopri di più su
        <a href="https://rmachine.dev/it/" className="underline ml-1 font-semibold">
          rmachine.dev/it
        </a>
      </>
    ),
  },
});
