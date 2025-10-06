import type { R_Common } from "./en";

const r_common: R_Common = {
  title: "Esempio di R-Machine con Vite 2",
  welcomeMessage: "Benvenuto in R-Machine con Vite!",
  currentLanguage: ({ locale }: { locale: string }) => {
    return `La lingua corrente è: ${locale}`;
  },
};

export default r_common;
