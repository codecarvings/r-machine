import type { R$ } from "r-machine";
import type { R_Common } from "./en";

export const r = ($: R$) =>
  ({
    title: "Esempio di R-Machine con React",
    welcomeMessage: "Benvenuto in R-Machine con React!",
    currentLanguage: ({ locale }: { locale: string }) => {
      return `La lingua corrente è: ${locale} - NS: ${$.namespace}`;
    },
  }) satisfies R_Common;
