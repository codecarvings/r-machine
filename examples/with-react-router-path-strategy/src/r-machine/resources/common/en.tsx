import type { R, R$ } from "r-machine";

const r_common = ($: R$) => ({
  title: "R-Machine example with Vite",
  welcomeMessage: "Welcome to R-Machine with Vite!",
  currentLanguage: ({ locale }: { locale: string }) => {
    return `Current language is: ${locale} - NS: ${$.namespace}`;
  },
});

export type R_Common = R<typeof r_common>;
export default r_common;
