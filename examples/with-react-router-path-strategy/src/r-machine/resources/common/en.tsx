import type { R, R$ } from "r-machine";

export const r = ($: R$) => ({
  title: "R-Machine example with React",
  welcomeMessage: "Welcome to R-Machine with React!",
  currentLanguage: ({ locale }: { locale: string }) => {
    return `Current language is: ${locale} - NS: ${$.namespace}`;
  },
});

export type R_Common = R<typeof r>;
