import type { R$ } from "r-machine";
import type { R_Common } from "./en";

const r_common: R_Common = ($: R$) => ({
  title: "Esempio di R-Machine con Vite 2",
  welcomeMessage: "Benvenuto in R-Machine con Vite!",
  currentLanguage: ({ locale }: { locale: string }) => {
    return `La lingua corrente è: ${locale} - NS: ${$.namespace}`;
  },
});

export default r_common;
