import type { R$ } from "r-machine";
import type { R_Common } from "./en";

const rFactory = ($: R$) => {
  const format = new Intl.DateTimeFormat($.locale, {
    dateStyle: "full",
    timeStyle: "long",
  });

  return {
    title: "Esempio di R-Machine con React",
    welcomeMessage: ({ date }: { date: Date }) => `Benvenuto in R-Machine con React! - ${format.format(date)}`,
    currentLanguage: `La lingua corrente è: (${$.locale}) - NS: ${$.namespace}`,
  } as R_Common;
};

export default rFactory;
